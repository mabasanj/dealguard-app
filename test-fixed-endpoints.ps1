# Test the fixed endpoints

# 1. Register a test user
Write-Host "=== TESTING FIXED ENDPOINTS ===" -ForegroundColor Green
Write-Host ""
Write-Host "1. Registering test user..." -ForegroundColor Blue

$registerBody = @{
    email = "testfix@example.com"
    password = "Test@123456"
    name = "Test User Fix"
} | ConvertTo-Json

$registerResponse = Invoke-WebRequest -Uri "http://localhost:5001/api/auth/register" `
    -Method Post `
    -ContentType "application/json" `
    -Body $registerBody `
    -ErrorAction SilentlyContinue

$user = $registerResponse.Content | ConvertFrom-Json
$token = $user.token
$userId = $user.user.id

Write-Host "✓ User created: $($user.user.email)" -ForegroundColor Green
Write-Host "  User ID: $userId"
Write-Host ""

# 2. Create an escrow to get an ID
Write-Host "2. Creating escrow transaction..." -ForegroundColor Blue

$escrowBody = @{
    title = "Test Escrow"
    description = "Test escrow for endpoint testing"
    amount = 500
    currency = "ZAR"
    buyerId = $userId
    sellerId = $userId
} | ConvertTo-Json

$escrowResponse = Invoke-WebRequest -Uri "http://localhost:5001/api/escrow" `
    -Method Post `
    -ContentType "application/json" `
    -Body $escrowBody `
    -Headers @{ Authorization = "Bearer $token" } `
    -ErrorAction SilentlyContinue

$escrow = ($escrowResponse.Content | ConvertFrom-Json).escrow
$escrowId = $escrow.id

Write-Host "✓ Escrow created successfully" -ForegroundColor Green
Write-Host "  Escrow ID: $escrowId"
Write-Host "  Amount: $($escrow.amount) $($escrow.currency)"
Write-Host ""

# 3. Test Payment Initiate (FIXED)
Write-Host "3. Testing Payment Initiate endpoint..." -ForegroundColor Blue

$paymentBody = @{
    escrowId = $escrowId
    paymentMethod = "CARD"
} | ConvertTo-Json

try {
    $paymentResponse = Invoke-WebRequest -Uri "http://localhost:5001/api/payments/initiate" `
        -Method Post `
        -ContentType "application/json" `
        -Body $paymentBody `
        -Headers @{ Authorization = "Bearer $token" } `
        -ErrorAction Stop
    
    Write-Host "✓ Payment Initiate endpoint FIXED - Status: $($paymentResponse.StatusCode)" -ForegroundColor Green
    $paymentData = $paymentResponse.Content | ConvertFrom-Json
    Write-Host "  Response: $($paymentData | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
} catch {
    $error = $_.Exception.Response.StatusCode
    $body = $_.Exception.Message
    Write-Host "✗ Payment Initiate FAILED - Status: $error" -ForegroundColor Red
    Write-Host "  Error: $body" -ForegroundColor Red
}
Write-Host ""

# 4. Test Create Dispute (FIXED)
Write-Host "4. Testing Create Dispute endpoint..." -ForegroundColor Blue

$disputeBody = @{
    escrowId = $escrowId
    reason = "ITEM_NOT_RECEIVED"
    description = "Item was not received as promised"
} | ConvertTo-Json

try {
    $disputeResponse = Invoke-WebRequest -Uri "http://localhost:5001/api/disputes" `
        -Method Post `
        -ContentType "application/json" `
        -Body $disputeBody `
        -Headers @{ Authorization = "Bearer $token" } `
        -ErrorAction Stop
    
    Write-Host "✓ Create Dispute endpoint FIXED - Status: $($disputeResponse.StatusCode)" -ForegroundColor Green
    $disputeData = $disputeResponse.Content | ConvertFrom-Json
    Write-Host "  Response: $($disputeData | ConvertTo-Json -Compress)" -ForegroundColor DarkGray
} catch {
    $error = $_.Exception.Response.StatusCode
    $body = $_.Exception.Message
    Write-Host "✗ Create Dispute FAILED - Status: $error" -ForegroundColor Red
    Write-Host "  Error: $body" -ForegroundColor Red
}
Write-Host ""

Write-Host "=== TESTING COMPLETE ===" -ForegroundColor Green
