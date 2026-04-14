param(
  [string]$BaseUrl = "http://localhost:5001/api"
)

$ErrorActionPreference = "Stop"

function Step($text) {
  Write-Host "`n=== $text ===" -ForegroundColor Cyan
}

function Get-StatusCodeFromException($ex) {
  if ($ex.Exception -and $ex.Exception.Response -and $ex.Exception.Response.StatusCode) {
    return [int]$ex.Exception.Response.StatusCode
  }
  return -1
}

function Invoke-JsonRequest($method, $url, $body = $null, $token = $null) {
  $headers = @{ "Content-Type" = "application/json" }
  if ($token) {
    $headers["Authorization"] = "Bearer $token"
  }

  try {
    $response = if ($body -ne $null) {
      Invoke-RestMethod -Method $method -Uri $url -Headers $headers -Body ($body | ConvertTo-Json -Depth 10)
    } else {
      Invoke-RestMethod -Method $method -Uri $url -Headers $headers
    }

    return @{ status = 200; body = $response }
  } catch {
    $status = Get-StatusCodeFromException $_
    return @{ status = $status; body = $_.Exception.Message }
  }
}

function Assert-Status($actual, $expected, $label) {
  if ($actual -ne $expected) {
    throw "$label failed. Expected HTTP $expected, got HTTP $actual"
  }
}

Step "Backend health"
$health = Invoke-RestMethod -Method Get -Uri "http://localhost:5001/health"
$health | ConvertTo-Json -Depth 4 | Write-Host

$ts = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds()
$email = "stellar.smoke.$ts@example.com"
$password = "Passw0rd!"

Step "Register and login test user"
$register = Invoke-JsonRequest "POST" "$BaseUrl/auth/register" @{
  email = $email
  password = $password
  name = "Stellar Smoke"
  phone = "+27333333333"
  role = "BUYER"
}
if ($register.status -ne 200 -and $register.status -ne 201) {
  throw "Register failed with HTTP $($register.status): $($register.body)"
}

$login = Invoke-JsonRequest "POST" "$BaseUrl/auth/login" @{
  email = $email
  password = $password
}
if ($login.status -ne 200) {
  throw "Login failed with HTTP $($login.status): $($login.body)"
}
$token = $login.body.token
if (-not $token) {
  throw "Login response missing token"
}

Step "Stellar auth enforcement"
$noAuth = Invoke-JsonRequest "POST" "$BaseUrl/stellar/submit-signed-xdr" @{ xdr = "AAAA" }
Assert-Status $noAuth.status 401 "Unauthenticated stellar request"

Step "Stellar request validation"
$missingXdr = Invoke-JsonRequest "POST" "$BaseUrl/stellar/submit-signed-xdr" @{} $token
Assert-Status $missingXdr.status 400 "Missing xdr validation"

$invalidRelease = Invoke-JsonRequest "POST" "$BaseUrl/stellar/release-funds-xdr" @{
  escrowPubKey = "BAD"
  sellerPubKey = "BAD"
  appSecretKey = "BAD"
  amount = "10.0000000"
} $token
Assert-Status $invalidRelease.status 400 "Invalid key validation for release-funds-xdr"

$invalidSetup = Invoke-JsonRequest "POST" "$BaseUrl/stellar/setup-escrow" @{
  escrowSecret = "BAD"
  buyerPubKey = "BAD"
  sellerPubKey = "BAD"
  appPubKey = "BAD"
} $token
Assert-Status $invalidSetup.status 400 "Invalid key validation for setup-escrow"

Step "Stellar smoke result"
Write-Host "PASS: stellar backend auth + validation checks succeeded" -ForegroundColor Green
Write-Host "User: $email"
