param(
  [string]$BaseUrl
)

$ErrorActionPreference = "Stop"

if (-not $BaseUrl) {
  $backendPort = if ($env:BACKEND_PORT) { $env:BACKEND_PORT } elseif ($env:PORT) { $env:PORT } else { "5000" }
  $BaseUrl = "http://localhost:$backendPort/api"
}
$HealthUrl = ($BaseUrl -replace '/api/?$', '') + "/health"

function Write-Step($msg) {
  Write-Host "`n=== $msg ===" -ForegroundColor Cyan
}

function Invoke-JsonPost($url, $body, $token = $null) {
  $headers = @{ "Content-Type" = "application/json" }
  if ($token) {
    $headers["Authorization"] = "Bearer $token"
  }

  return Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body ($body | ConvertTo-Json -Depth 10)
}

function Invoke-JsonGet($url, $token = $null) {
  $headers = @{}
  if ($token) {
    $headers["Authorization"] = "Bearer $token"
  }
  return Invoke-RestMethod -Uri $url -Method Get -Headers $headers
}

Write-Step "Health check"
$health = Invoke-RestMethod -Uri $HealthUrl -Method Get
$health | ConvertTo-Json -Depth 5 | Write-Host

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$buyerEmail = "smoke.buyer.$ts@example.com"
$sellerEmail = "smoke.seller.$ts@example.com"
$password = "Passw0rd!"

Write-Step "Register seller"
$sellerReg = Invoke-JsonPost "$BaseUrl/auth/register" @{
  email = $sellerEmail
  password = $password
  name = "Smoke Seller"
  phone = "+27123456789"
  role = "SELLER"
}
$sellerReg | ConvertTo-Json -Depth 6 | Write-Host

Write-Step "Register buyer"
$buyerReg = Invoke-JsonPost "$BaseUrl/auth/register" @{
  email = $buyerEmail
  password = $password
  name = "Smoke Buyer"
  phone = "+27987654321"
  role = "BUYER"
}
$buyerReg | ConvertTo-Json -Depth 6 | Write-Host

Write-Step "Login buyer"
$buyerLogin = Invoke-JsonPost "$BaseUrl/auth/login" @{
  email = $buyerEmail
  password = $password
}
$buyerToken = $buyerLogin.token
if (-not $buyerToken) {
  throw "Buyer token missing from login response"
}

Write-Step "Create escrow as buyer using sellerEmail"
$createEscrow = Invoke-JsonPost "$BaseUrl/escrow" @{
  title = "Smoke Test Trade"
  description = "Integration smoke test escrow"
  amount = 150
  currency = "ZAR"
  sellerEmail = $sellerEmail
  terms = "Release after delivery"
} $buyerToken

$escrowId = $createEscrow.escrow.id
if (-not $escrowId) {
  throw "Escrow ID missing from create response"
}
$createEscrow | ConvertTo-Json -Depth 6 | Write-Host

Write-Step "List escrows for buyer"
$listEscrows = Invoke-JsonGet "$BaseUrl/escrow?page=1&limit=5" $buyerToken
$listEscrows | ConvertTo-Json -Depth 6 | Write-Host

Write-Step "Smoke test result"
Write-Host "PASS: Backend auth + escrow creation + escrow listing succeeded." -ForegroundColor Green
Write-Host "Buyer: $buyerEmail"
Write-Host "Seller: $sellerEmail"
Write-Host "EscrowId: $escrowId"
