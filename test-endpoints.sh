#!/usr/bin/env bash

echo "=== TESTING FIXED ENDPOINTS ==="
echo ""

# 1. Register test user
echo "1. Registering test user..."
REGISTER=$(curl -s -X POST http://localhost:5001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testfix@example.com",
    "password": "Test@123456",
    "name": "Test User Fix"
  }')

TOKEN=$(echo $REGISTER | jq -r '.token')
USERID=$(echo $REGISTER | jq -r '.user.id')

echo "✓ User created"
echo "  User ID: $USERID"
echo "  Token: ${TOKEN:0:30}..."
echo ""

# 2. Create an escrow
echo "2. Creating escrow transaction..."
ESCROW=$(curl -s -X POST http://localhost:5001/api/escrow \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Test Escrow",
    "description": "Test escrow for endpoint testing",
    "amount": 500,
    "currency": "ZAR",
    "buyerId": "'$USERID'",
    "sellerId": "'$USERID'"
  }')

ESCROWID=$(echo $ESCROW | jq -r '.escrow.id')

echo "✓ Escrow created"
echo "  Escrow ID: $ESCROWID"
echo ""

# 3. Test Payment Initiate
echo "3. Testing Payment Initiate endpoint..."
PAYMENT_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5001/api/payments/initiate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "escrowId": "'$ESCROWID'",
    "paymentMethod": "CARD"
  }')

HTTP_CODE=$(echo "$PAYMENT_RESPONSE" | tail -n1)
PAYMENT_BODY=$(echo "$PAYMENT_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✓ Payment Initiate FIXED - Status: $HTTP_CODE"
  echo "  $PAYMENT_BODY" | jq .
else
  echo "✗ Payment Initiate FAILED - Status: $HTTP_CODE"
  echo "  $PAYMENT_BODY" | jq .
fi
echo ""

# 4. Test Create Dispute
echo "4. Testing Create Dispute endpoint..."
DISPUTE_RESPONSE=$(curl -s -w "\n%{http_code}" -X POST http://localhost:5001/api/disputes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "escrowId": "'$ESCROWID'",
    "reason": "ITEM_NOT_RECEIVED",
    "description": "Item was not received as promised"
  }')

HTTP_CODE=$(echo "$DISPUTE_RESPONSE" | tail -n1)
DISPUTE_BODY=$(echo "$DISPUTE_RESPONSE" | head -n-1)

if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
  echo "✓ Create Dispute FIXED - Status: $HTTP_CODE"
  echo "  $DISPUTE_BODY" | jq .
else
  echo "✗ Create Dispute FAILED - Status: $HTTP_CODE"
  echo "  $DISPUTE_BODY" | jq . 2>/dev/null || echo "  $DISPUTE_BODY"
fi
echo ""

echo "=== TESTING COMPLETE ==="
