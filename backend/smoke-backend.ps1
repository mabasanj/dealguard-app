param(
  [string]$BaseUrl = "http://localhost:5001/api"
)

$ErrorActionPreference = "Stop"

function Step($text) {
  Write-Host "`n=== $text ===" -ForegroundColor Cyan
}

function PostJson($url, $body, $token = $null) {
  $headers = @{ "Content-Type" = "application/json" }
  if ($token) {
    $headers["Authorization"] = "Bearer $token"
  }
  return Invoke-RestMethod -Method Post -Uri $url -Headers $headers -Body ($body | ConvertTo-Json -Depth 10)
}

function PatchJson($url, $body, $token = $null) {
  $headers = @{ "Content-Type" = "application/json" }
  if ($token) {
    $headers["Authorization"] = "Bearer $token"
  }
  return Invoke-RestMethod -Method Patch -Uri $url -Headers $headers -Body ($body | ConvertTo-Json -Depth 10)
}

function GetJson($url, $token = $null) {
  $headers = @{}
  if ($token) {
    $headers["Authorization"] = "Bearer $token"
  }
  return Invoke-RestMethod -Method Get -Uri $url -Headers $headers
}

Step "Backend health"
$health = Invoke-RestMethod -Method Get -Uri "http://localhost:5001/health"
$health | ConvertTo-Json -Depth 4 | Write-Host

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$buyerEmail = "be.smoke.buyer.$ts@example.com"
$sellerEmail = "be.smoke.seller.$ts@example.com"
$password = "Passw0rd!"

Step "Register seller"
PostJson "$BaseUrl/auth/register" @{
  email = $sellerEmail
  password = $password
  name = "Backend Smoke Seller"
  phone = "+27111111111"
  role = "SELLER"
} | Out-Null

Step "Register buyer"
PostJson "$BaseUrl/auth/register" @{
  email = $buyerEmail
  password = $password
  name = "Backend Smoke Buyer"
  phone = "+27222222222"
  role = "BUYER"
} | Out-Null

Step "Login buyer and seller"
$buyerLogin = PostJson "$BaseUrl/auth/login" @{ email = $buyerEmail; password = $password }
$sellerLogin = PostJson "$BaseUrl/auth/login" @{ email = $sellerEmail; password = $password }
$buyerToken = $buyerLogin.token
$sellerToken = $sellerLogin.token
if (-not $buyerToken -or -not $sellerToken) {
  throw "Missing auth tokens from login response"
}

Step "Create escrow"
$escrowResp = PostJson "$BaseUrl/escrow" @{
  title = "Backend lifecycle smoke"
  description = "Validate backend escrow lifecycle transitions"
  amount = 200
  currency = "ZAR"
  sellerEmail = $sellerEmail
  terms = "Deliver before release"
} $buyerToken
$escrowId = $escrowResp.escrow.id
if (-not $escrowId) {
  throw "Escrow ID not found"
}

Step "Progress escrow statuses"
PatchJson "$BaseUrl/escrow/$escrowId/status" @{ status = "PENDING_PAYMENT" } $buyerToken | Out-Null
PatchJson "$BaseUrl/escrow/$escrowId/status" @{ status = "FUNDED" } $buyerToken | Out-Null
PatchJson "$BaseUrl/escrow/$escrowId/status" @{ status = "IN_DELIVERY" } $sellerToken | Out-Null
PatchJson "$BaseUrl/escrow/$escrowId/status" @{ status = "DELIVERED" } $sellerToken | Out-Null

Step "Release funds endpoint"
$release = PostJson "$BaseUrl/escrow/$escrowId/release" @{} $buyerToken
$release | ConvertTo-Json -Depth 6 | Write-Host
if ($release.escrow.status -ne "COMPLETED") {
  throw "Expected COMPLETED status after release"
}

Step "Verify escrow listing contains completed escrow"
$list = GetJson "$BaseUrl/escrow?page=1&limit=10" $buyerToken
$found = $list.escrows | Where-Object { $_.id -eq $escrowId }
if (-not $found) {
  throw "Completed escrow not found in buyer escrow list"
}

Step "Backend smoke result"
Write-Host "PASS: backend lifecycle and release flow verified" -ForegroundColor Green
Write-Host "Buyer: $buyerEmail"
Write-Host "Seller: $sellerEmail"
Write-Host "EscrowId: $escrowId"
