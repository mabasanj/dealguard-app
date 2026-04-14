# Final API Verification - Test the 3 fixed endpoints

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Final API Verification" -ForegroundColor Cyan
Write-Host "Testing 3 Previously-Failing Endpoints" -ForegroundColor Yellow
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:5001/api"
$results = @()

# Register first user (BUYER)
Write-Host "[Step 1] Registering buyer..." -ForegroundColor Cyan
$buyerBody = @{email="buyer$(Get-Random)@example.com";password="Test@123";name="Buyer";phone="0123456789"} | ConvertTo-Json
try {
    $buyerResp = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $buyerBody -ContentType "application/json" -UseBasicParsing
    $buyerToken = $buyerResp.token
    $buyerId = $buyerResp.user.id
    Write-Host "  SUCCESS - Buyer registered" -ForegroundColor Green
} catch {
    Write-Host "  FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Register second user (SELLER)
Write-Host "[Step 2] Registering seller..." -ForegroundColor Cyan
$sellerBody = @{email="seller$(Get-Random)@example.com";password="Test@123";name="Seller";phone="0987654321"} | ConvertTo-Json
try {
    $sellerResp = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method POST -Body $sellerBody -ContentType "application/json" -UseBasicParsing
    $sellerToken = $sellerResp.token
    $sellerId = $sellerResp.user.id
    Write-Host "  SUCCESS - Seller registered" -ForegroundColor Green
} catch {
    Write-Host "  FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create an escrow transaction
Write-Host "[Step 3] Creating escrow..." -ForegroundColor Cyan
$escrowBody = @{
    title="Test Product"
    description="Test product for escrow"
    amount=100
    currency="ZAR"
    buyerId=$buyerId
    sellerId=$sellerId
    category="Electronics"
    deliveryTime=7
    inspectionPeriod=3
} | ConvertTo-Json

try {
    $escrowResp = Invoke-RestMethod -Uri "$baseUrl/escrow" -Method POST -Body $escrowBody -ContentType "application/json" -Headers @{"Authorization"="Bearer $buyerToken"} -UseBasicParsing
    $escrowId = $escrowResp.id
    Write-Host "  SUCCESS - Escrow created (ID: $escrowId)" -ForegroundColor Green
} catch {
    Write-Host "  FAILED - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Testing the 3 FIXED Endpoints" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

$passCount = 0
$failCount = 0

# TEST 1: Payment Initiate (PREVIOUSLY FAILING - NOW FIXED)
Write-Host "[1] Payment Initiate Endpoint" -ForegroundColor Magenta
Write-Host "  Endpoint: POST /api/payments/initiate" -ForegroundColor Gray
Write-Host "  Key Parameter: escrowId=$($escrowId.Substring(0,15))... (CUID format)" -ForegroundColor Gray

$paymentBody = @{escrowId=$escrowId;paymentMethod="WALLET"} | ConvertTo-Json
try {
    $paymentResp = Invoke-RestMethod -Uri "$baseUrl/payments/initiate" -Method POST -Body $paymentBody -ContentType "application/json" -Headers @{"Authorization"="Bearer $buyerToken"} -UseBasicParsing
    Write-Host "  Result: PASS - Accepted CUID format ID" -ForegroundColor Green
    Write-Host "  Previous error: 400 Bad Request (UUID validation mismatch)" -ForegroundColor DarkGreen
    Write-Host "  Current result: Success!" -ForegroundColor Green
    $passCount++
} catch {
    $msg = $_.Exception.Message
    $code = $_.Exception.Response.StatusCode.Value__
    Write-Host "  Result: FAIL - Status Code $code" -ForegroundColor Red
    Write-Host "  Error: $msg" -ForegroundColor Red
    $failCount++
}

Write-Host ""

# TEST 2: Create Dispute (PREVIOUSLY FAILING - NOW FIXED)
Write-Host "[2] Create Dispute Endpoint" -ForegroundColor Magenta
Write-Host "  Endpoint: POST /api/disputes" -ForegroundColor Gray
Write-Host "  Key Parameter: escrowId=$($escrowId.Substring(0,15))... (CUID format)" -ForegroundColor Gray

$disputeBody = @{
    escrowId=$escrowId
    reason="ITEM_NOT_RECEIVED"
    description="Product did not arrive"
} | ConvertTo-Json

try {
    $disputeResp = Invoke-RestMethod -Uri "$baseUrl/disputes" -Method POST -Body $disputeBody -ContentType "application/json" -Headers @{"Authorization"="Bearer $buyerToken"} -UseBasicParsing
    $disputeId = $disputeResp.id
    Write-Host "  Result: PASS - Accepted CUID format ID" -ForegroundColor Green
    Write-Host "  Previous error: 400 Bad Request (UUID validation mismatch)" -ForegroundColor DarkGreen
    Write-Host "  Current result: Success! (Dispute ID: $($disputeId.Substring(0,15))...)" -ForegroundColor Green
    $passCount++
} catch {
    $msg = $_.Exception.Message
    $code = $_.Exception.Response.StatusCode.Value__
    Write-Host "  Result: FAIL - Status Code $code" -ForegroundColor Red
    Write-Host "  Error: $msg" -ForegroundColor Red
    $failCount++
    $disputeId = $null
}

Write-Host ""

# TEST 3: Resolve Dispute (PREVIOUSLY FAILING - NOW FIXED)
if ($disputeId) {
    Write-Host "[3] Resolve Dispute Endpoint" -ForegroundColor Magenta
    Write-Host "  Endpoint: POST /api/disputes/:id/resolve" -ForegroundColor Gray
    Write-Host "  Key Parameter: winnerId=$($buyerId.Substring(0,15))... (CUID format)" -ForegroundColor Gray

    $resolveBody = @{winnerId=$buyerId;resolution="BUYER_WINS"} | ConvertTo-Json

    try {
        $resolveResp = Invoke-RestMethod -Uri "$baseUrl/disputes/$disputeId/resolve" -Method POST -Body $resolveBody -ContentType "application/json" -Headers @{"Authorization"="Bearer $sellerToken"} -UseBasicParsing
        Write-Host "  Result: PASS - Accepted CUID format ID" -ForegroundColor Green
        Write-Host "  Previous error: 400 Bad Request (UUID validation mismatch)" -ForegroundColor DarkGreen
        Write-Host "  Current result: Success!" -ForegroundColor Green
        $passCount++
    } catch {
        $msg = $_.Exception.Message
        $code = $_.Exception.Response.StatusCode.Value__
        Write-Host "  Result: FAIL - Status Code $code" -ForegroundColor Red
        Write-Host "  Error: $msg" -ForegroundColor Red
        $failCount++
    }
} else {
    Write-Host "[3] Resolve Dispute Endpoint - SKIPPED (No dispute created)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "FINAL RESULTS" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Passed: $passCount/3" -ForegroundColor Green
Write-Host "Failed: $failCount/3" -ForegroundColor $(if ($failCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failCount -eq 0) {
    Write-Host "SUCCESS - All 3 previously-failing endpoints now work!" -ForegroundColor Green
    Write-Host ""
    Write-Host "The ID format validation issue has been RESOLVED:" -ForegroundColor Green
    Write-Host "  - Payment Initiate: FIXED" -ForegroundColor Green
    Write-Host "  - Create Dispute: FIXED" -ForegroundColor Green
    Write-Host "  - Resolve Dispute: FIXED" -ForegroundColor Green
    Write-Host ""
    Write-Host "Integration is now ready for launch testing!" -ForegroundColor Green
} else {
    Write-Host "FAILURE - Some endpoints still failing" -ForegroundColor Red
}

Write-Host ""
