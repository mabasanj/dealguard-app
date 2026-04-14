# Simple test for fixed endpoints
$baseUrl = "http://localhost:5001/api"

# Test 1: Register
Write-Host "Testing Payment and Dispute endpoints..." -ForegroundColor Green

$registerReq = @{
    email = "endpointtest@example.com"
    password = "Test@123456"
    name = "Endpoint Test"
}

Write-Host "1. Registering user..." -ForegroundColor Blue
$registerResp = Invoke-WebRequest -Uri "$baseUrl/auth/register" -Method Post -ContentType "application/json" -Body ($registerReq | ConvertTo-Json) -UseBasicParsing
$user = $registerResp.Content | ConvertFrom-Json

$token = $user.token
$userId = $user.user.id

Write-Host "✓ User registered" -ForegroundColor Green
Write-Host "  ID: $userId" -ForegroundColor Gray

# Test 2: Create Escrow
Write-Host ""
Write-Host "2. Creating escrow..." -ForegroundColor Blue

$escrowReq = @{
    title = "Endpoint Test Escrow"
    description = "Testing endpoints"
    amount = 500
    currency = "ZAR"
    buyerId = $userId
    sellerId = $userId
}

$escrowResp = Invoke-WebRequest -Uri "$baseUrl/escrow" -Method Post -ContentType "application/json" -Body ($escrowReq | ConvertTo-Json) -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing
$escrow = ($escrowResp.Content | ConvertFrom-Json).escrow
$escrowId = $escrow.id

Write-Host "✓ Escrow created" -ForegroundColor Green
Write-Host "  ID: $escrowId" -ForegroundColor Gray

# Test 3: Payment Initiate (FIXED)
Write-Host ""
Write-Host "3. Testing Payment Initiate (FIXED)..." -ForegroundColor Blue

$paymentReq = @{
    escrowId = $escrowId
    paymentMethod = "CARD"
}

try {
    $paymentResp = Invoke-WebRequest -Uri "$baseUrl/payments/initiate" -Method Post -ContentType "application/json" -Body ($paymentReq | ConvertTo-Json) -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ FIXED - Payment Initiate works!" -ForegroundColor Green
    Write-Host "  Status: $($paymentResp.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "✗ FAILED - Payment Initiate" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

# Test 4: Create Dispute (FIXED)
Write-Host ""
Write-Host "4. Testing Create Dispute (FIXED)..." -ForegroundColor Blue

$disputeReq = @{
    escrowId = $escrowId
    reason = "ITEM_NOT_RECEIVED"
    description = "Testing dispute endpoint"
}

try {
    $disputeResp = Invoke-WebRequest -Uri "$baseUrl/disputes" -Method Post -ContentType "application/json" -Body ($disputeReq | ConvertTo-Json) -Headers @{ Authorization = "Bearer $token" } -UseBasicParsing -ErrorAction Stop
    Write-Host "✓ FIXED - Create Dispute works!" -ForegroundColor Green
    Write-Host "  Status: $($disputeResp.StatusCode)" -ForegroundColor Gray
} catch {
    Write-Host "✗ FAILED - Create Dispute" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
}

Write-Host ""
Write-Host "Testing complete!" -ForegroundColor Green
