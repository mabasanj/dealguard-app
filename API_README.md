# Escrow App Backend API

This is the backend API for the South African escrow application, built with Next.js API routes, Prisma, and PostgreSQL.

## Features

- JWT Authentication
- Escrow Transaction Management
- Wallet System
- Payment Processing (Stripe)
- Dispute Resolution
- Notifications

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Escrow
- `POST /api/escrow` - Create escrow transaction
- `GET /api/escrow` - Get user's escrows
- `PATCH /api/escrow/[id]/status` - Update escrow status

### Wallet
- `GET /api/wallet/balance` - Get wallet balance

### Payments
- `POST /api/payments/create-payment-intent` - Create payment intent
- `POST /api/payments/webhook` - Stripe webhook handler

### Disputes
- `POST /api/disputes` - Create dispute
- `GET /api/disputes` - Get user's disputes

### Notifications
- `GET /api/notifications` - Get notifications
- `PATCH /api/notifications` - Mark notifications as read

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up environment variables:
   ```bash
   cp .env.example .env.local
   ```

3. Set up database:
   ```bash
   npx prisma migrate dev
   npx prisma generate
   ```

4. Run development server:
   ```bash
   npm run dev
   ```

## Authentication

All API endpoints except `/api/auth/*` require JWT authentication. Include the token in the Authorization header:

```
Authorization: Bearer <jwt-token>
```

## Payment Flow

1. Mobile app calls `/api/payments/create-payment-intent` with amount
2. Backend creates Stripe PaymentIntent and returns client_secret
3. Mobile app uses client_secret to complete payment with Stripe SDK
4. Stripe sends webhook to `/api/payments/webhook`
5. Backend updates payment status and wallet/escrow accordingly

## Escrow Flow

1. Buyer creates escrow via `/api/escrow`
2. Buyer pays via payment flow
3. Escrow status updates to PAYMENT_CONFIRMED
4. Seller ships goods, updates status to GOODS_SHIPPED
5. Buyer receives goods, updates to GOODS_RECEIVED
6. Buyer confirms, status becomes COMPLETED, funds released to seller

## Dispute Flow

1. Either party creates dispute via `/api/disputes`
2. Escrow status becomes DISPUTED
3. Admin reviews and resolves dispute
4. Funds refunded or paid based on resolution