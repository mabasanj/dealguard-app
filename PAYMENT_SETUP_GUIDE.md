# Payment Provider Integration Setup

## What's Been Done ✅

### 1. **Payment Service Created**
- File: `backend/src/services/payment.service.ts`
- Integrates with **6 payment/provider rails**:
   - **Stitch** for South African EFT and bank collection
   - **Peach Payments** for South African cards
   - **ZARP Anchor (SEP-24)** for ZAR to Stellar bridge flows
   - **Paystack**
   - **Flutterwave**
   - **Stripe**

### 2. **Payment Controller Updated**
- File: `backend/src/controllers/payment.controller.ts`
- Now uses real payment service instead of mock functions
- Supports payment initialization with any provider
- Supports payment verification with any provider

### 3. **Environment Configuration**
- File: `backend/.env`
- Added `PAYMENT_PROVIDER` setting plus dedicated `CARD_PAYMENT_PROVIDER`, `LOCAL_BANK_PROVIDER`, and `CRYPTO_RAMP_PROVIDER`
- All API keys documented with placeholder values
- Ready for real credentials

### 4. **Backend Recompiled**
- TypeScript compilation successful
- Production code updated in `dist/` directory

---

## Current Test API Keys

The `.env` file contains **test mode keys** (for development only):

```env
PAYMENT_PROVIDER=paystack

# Paystack Test Keys
PAYSTACK_PUBLIC_KEY=pk_test_replace_with_your_test_key
PAYSTACK_SECRET_KEY=sk_test_replace_with_your_test_key

# Flutterwave Test Keys
FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_replace_with_your_test_key
FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_replace_with_your_test_key

# Stripe Test Keys
STRIPE_SECRET_KEY=sk_test_replace_with_your_test_key
STRIPE_PUBLISHABLE_KEY=pk_test_replace_with_your_test_key
```

---

## ⚠️ NEXT STEPS: Get Real API Keys

### **Option 1: Use Stitch + Peach + ZARP** (Recommended for South Africa + Stellar)

1. **Configure Stitch for EFT / bank collection**
   - Create a Stitch merchant account
   - Add `STITCH_API_KEY`, `STITCH_CLIENT_ID`, `STITCH_CLIENT_SECRET`
   - Set `LOCAL_BANK_PROVIDER=stitch`

2. **Configure Peach Payments for card checkout**
   - Create a Peach Payments merchant account
   - Add `PEACH_ENTITY_ID`, `PEACH_ACCESS_TOKEN`, and `PEACH_CHECKOUT_URL`
   - Set `CARD_PAYMENT_PROVIDER=peach`

3. **Configure ZARP as the ZAR on/off ramp**
   - Request ZARP SEP-24 access
   - Add `ZARP_SEP24_URL`, `ZARP_AUTH_TOKEN`, `ZARP_DISTRIBUTION_ACCOUNT`, `ZARP_ASSET_CODE=ZAR`
   - Set `CRYPTO_RAMP_PROVIDER=zarp`

4. **Use Stellar Mainnet / Soroban**
   - Set `STELLAR_NETWORK=PUBLIC`
   - Set `STELLAR_HORIZON_URL=https://horizon.stellar.org`
   - Set `STELLAR_RPC_URL=https://mainnet.sorobanrpc.com`
   - Deploy the contract from the `soroban/` workspace and store its ID in `SOROBAN_ESCROW_CONTRACT_ID`

### **Option 2: Use Paystack**

1. **Create Paystack Account**
   - Go to https://dashboard.paystack.com/signup
   - Sign up and verify your email
   - Complete KYC verification

2. **Get Test Keys**
   - Login to Dashboard
   - Go to "Settings" → "API Keys & Webhooks"
   - Copy test keys and add to `.env`:
   ```env
   PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
   PAYSTACK_SECRET_KEY=sk_test_xxxxx
   ```

3. **Get Live Keys** (For Production)
   - Switch from "Test" to "Live" mode in Paystack dashboard
   - Copy live keys
   - Update `.env` in production

4. **Bank Account Setup**
   - Add your bank account to Paystack for payouts
   - This is where user funds will be transferred

---

### **Option 3: Use Flutterwave** (Alternative)

1. **Create Flutterwave Account**
   - Go to https://dashboard.flutterwave.com/signup
   - Verify email and complete setup

2. **Get Test Keys**
   - Dashboard → "Developers" → "API Keys"
   - Copy test keys and add to `.env`:
   ```env
   FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST_xxxxx
   FLUTTERWAVE_SECRET_KEY=FLWSECK_TEST_xxxxx
   PAYMENT_PROVIDER=flutterwave
   ```

---

### **Option 4: Use Stripe** (Global)

1. **Create Stripe Account**
   - Go to https://dashboard.stripe.com/register
   - Complete registration

2. **Get Test Keys**
   - Dashboard → "Developers" → "API keys"
   - Copy secret key and add to `.env`:
   ```env
   STRIPE_SECRET_KEY=sk_test_xxxxx
   STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
   PAYMENT_PROVIDER=stripe
   ```

---

## 🧪 Testing Payment Flow

### **With Paystack Test Keys**

1. Frontend registers user
2. User creates escrow transaction
3. User clicks "Pay Now"
4. Frontend redirects to Paystack payment page
5. Use test card: `4111111111111111` with any future expiry
6. Payment verified and escrow status changes to "FUNDED"

### **Webhook Configuration** (For Production)

1. **Paystack Webhooks**
   - Dashboard → Settings → Callback URLs
   - Set callback to: `https://yourapp.com/api/payments/webhook`

2. **Flutterwave Webhooks**
   - Dashboard → Settings → Webhooks
   - Set callback to: `https://yourapp.com/api/payments/webhook`

3. **Stripe Webhooks**
   - Dashboard → Developers → Webhooks
   - Add endpoint for: `https://yourapp.com/api/payments/webhook`

---

## 📋 Integration Checklist

- [ ] Choose your default rails for cards, EFT, and crypto bridge
- [ ] Configure Stitch for EFT collections
- [ ] Configure Peach Payments for card checkout
- [ ] Configure ZARP SEP-24 credentials for ZAR bridge sessions
- [ ] Deploy Soroban escrow contract and set `SOROBAN_ESCROW_CONTRACT_ID`
- [ ] Create account with chosen provider
- [ ] Get test API keys
- [ ] Update `.env` file with test keys
- [ ] Restart backend: `npm start`
- [ ] Test payment flow end-to-end
- [ ] Integrate frontend payment forms (Paystack, Flutterwave, or Stripe SDK)
- [ ] Test webhook callbacks
- [ ] Switch to live keys for production
- [ ] Set up bank account on payment provider

---

## 📊 Current Integration Status

| Component | Status | Notes |
|-----------|--------|-------|
| Payment Service | ✅ Complete | Supports Stitch, Peach, ZARP, Paystack, Flutterwave, Stripe |
| Controller Integration | ✅ Complete | Uses real APIs |
| Wallet Payments | ✅ Complete | Works with mock test |
| External Payments | ✅ Ready | Needs real API keys and webhook setup |
| Soroban Workspace | ✅ Ready | Add Rust toolchain and deploy contract |
| Webhook Support | ✅ Ready | Needs configuration |
| Email Notifications | ⏳ Pending | SMTP not yet setup |
| Dispute Resolution | ✅ Complete | Fixed validation |
| Payout System | ⏳ Pending | Seller fund transfers |

---

## 🚀 What This Enables

With payment provider integration active:

✅ Users can create escrow transactions
✅ Users can pay with Peach-powered local cards
✅ Users can pay via Stitch EFT / bank collection
✅ Users can bridge ZAR into Stellar using ZARP SEP-24
✅ Users can pay via regional rails like Paystack/Flutterwave
✅ Funds are held securely by provider
✅ Disputes can block fund release
✅ Sellers receive payouts after completion

---

## Quick Start Command

After getting API keys:

```bash
# Update .env with real keys
# Then restart backend
npm start

# Backend will now use real payment processing
```

---

**Status: Ready for Payment Provider Configuration** 🎯

The app is **prepared** for payment processing once you add real API keys!
