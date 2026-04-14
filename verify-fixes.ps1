# Verify that the 3 fixed endpoints now work correctly

Write-Host "`n=== API Endpoint Verification ===" -ForegroundColor Cyan
Write-Host "Testing the 3 recently fixed endpoints`n" -ForegroundColor Yellow

$baseUrl = "http://localhost:5001/api"
$passCount = 0
$failCount = 0

# Step 1: Register a test user
Write-Host "[1] Registering test user..." -ForegroundColor Cyan
$regBody = @{
    email = "test_$(Get-Random)@example.com"
    password = "TestPass@123"
    name = "TestUser"
    phone = "1234567890"
} | ConvertTo-Json

try {
    $regResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $regBody -ContentType "application/json" -UseBasicParsing
    $token = $regResponse.token
    $userId = $regResponse.user.id
    Write-Host "SUCCESS - User registered (ID: $userId)" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "FAILED - $($_.Exception.Message)" -ForegroundColor Red
    $failCount++
    exit 1
}

Write-Host ""

# Step 2: Create an escrow transaction
Write-Host "[2] Creating escrow transaction..." -ForegroundColor Cyan
$escrowBody = @{
    senderEmail = "test_$(Get-Random)@example.com"
    amount = 100
    reason = "Test transaction"
    goods_description = "Test goods"
} | ConvertTo-Json

try {
    $escrowResponse = Invoke-RestMethod -Uri "$baseUrl/escrow" -Method POST -Body $escrowBody -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -UseBasicParsing
    $escrowId = if ($escrowResponse.data) { $escrowResponse.data.id } else { $escrowResponse.id }
    Write-Host "SUCCESS - Escrow created (ID: $escrowId)" -ForegroundColor Green
    $passCount++
} catch {
    Write-Host "FAILED - Escrow creation failed: $($_.Exception.Message)" -ForegroundColor Red
    $failCount++
    exit 1
}

Write-Host ""

# Step 3: Test Payment Initiate (PREVIOUSLY FAILING - NOW FIXED)
Write-Host "[3] Testing Payment Initiate endpoint (WAS FAILING)..." -ForegroundColor Cyan
$paymentBody = @{
    escrowId = $escrowId
    paymentMethod = "WALLET"
} | ConvertTo-Json

try {
    $paymentResponse = Invoke-RestMethod -Uri "$baseUrl/payments/initiate" -Method POST -Body $paymentBody -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -UseBasicParsing
    Write-Host "SUCCESS - Payment initiate worked with CUID format ID" -ForegroundColor Green
    Write-Host "  Endpoint: POST /api/payments/initiate" -ForegroundColor Gray
    Write-Host "  Parameter: escrowId=$escrowId (CUID format)" -ForegroundColor Gray
    Write-Host "  Result: No more 400 validation error!" -ForegroundColor Green
    $passCount++
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    Write-Host "FAILED - Payment initiate returned $statusCode" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    $failCount++
}

Write-Host ""

# Step 4: Test Create Dispute (PREVIOUSLY FAILING - NOW FIXED)
Write-Host "[4] Testing Create Dispute endpoint (WAS FAILING)..." -ForegroundColor Cyan
$disputeBody = @{
    escrowId = $escrowId
    reason = "ITEM_NOT_RECEIVED"
    description = "Testing dispute creation"
} | ConvertTo-Json

try {
    $disputeResponse = Invoke-RestMethod -Uri "$baseUrl/disputes" -Method POST -Body $disputeBody -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -UseBasicParsing
    Write-Host "SUCCESS - Create dispute worked with CUID format ID" -ForegroundColor Green
    Write-Host "  Endpoint: POST /api/disputes" -ForegroundColor Gray
    Write-Host "  Parameter: escrowId=$escrowId (CUID format)" -ForegroundColor Gray
    Write-Host "  Result: No more 400 validation error!" -ForegroundColor Green
    $passCount++
    $disputeId = if ($disputeResponse.data) { $disputeResponse.data.id } else { $disputeResponse.id }
} catch {
    $statusCode = $_.Exception.Response.StatusCode.Value__
    Write-Host "FAILED - Create dispute returned $statusCode" -ForegroundColor Red
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
    $failCount++
}

Write-Host ""

# Step 5: Test Resolve Dispute (PREVIOUSLY FAILING - NOW FIXED)
Write-Host "[5] Testing Resolve Dispute endpoint (WAS FAILING)..." -ForegroundColor Cyan
$resolveBody = @{
    winnerId = $userId
    resolution = "BUYER_WINS"
} | ConvertTo-Json

if ($disputeId) {
    try {
        $resolveResponse = Invoke-RestMethod -Uri "$baseUrl/disputes/$disputeId/resolve" -Method POST -Body $resolveBody -ContentType "application/json" -Headers @{"Authorization" = "Bearer $token"} -UseBasicParsing
        Write-Host "SUCCESS - Resolve dispute worked with CUID format ID" -ForegroundColor Green
        Write-Host "  Endpoint: POST /api/disputes/:id/resolve" -ForegroundColor Gray
        Write-Host "  Parameter: winnerId=$userId (CUID format)" -ForegroundColor Gray
        Write-Host "  Result: No more 400 validation error!" -ForegroundColor Green
        $passCount++
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.Value__
        Write-Host "FAILED - Resolve dispute returned $statusCode" -ForegroundColor Red
        Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Gray
        $failCount++
    }
} else {
    Write-Host "SKIPPED - No dispute ID from previous step" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== RESULTS ===" -ForegroundColor Cyan
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor $(if($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "ALL TESTS PASSED - Fixes are working correctly!" -ForegroundColor Green
} else {
    Write-Host "Some tests failed - Please review the errors above" -ForegroundColor Red
}

Write-Host ""
