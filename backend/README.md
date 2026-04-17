# SafeHaven Escrow Backend API

A robust Node.js Express backend API for SafeHaven Escrow - a South African fintech platform for informal trading on WhatsApp and Facebook, scalable to B2B and P2P transactions.

## Features

- ✅ **JWT Authentication** - Secure user authentication with JWT tokens
- ✅ **Escrow Transactions** - Create, manage, and complete escrow transactions
- ✅ **Wallet Management** - Add funds, withdraw, and transfer between users
- ✅ **Payment Processing** - Integration with Stitch, Peach Payments, ZARP, Flutterwave and Paystack
- ✅ **Soroban Ready** - Repo-scoped Soroban workspace for on-chain escrow lifecycle logic
- ✅ **Dispute Resolution** - Open, manage, and resolve disputes
- ✅ **Real-time Chat** - Socket.io integration for real-time messaging
- ✅ **Notifications** - Email and in-app notifications for all activities
- ✅ **Multi-currency Support** - ZAR, USD, EUR, KES, TZS, and other SADC currencies
- ✅ **Rate Limiting** - Built-in rate limiting to prevent abuse
- ✅ **Security** - Helmet for security headers, CORS configuration

## Tech Stack

- **Runtime**: Node.js 18+
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io
- **Authentication**: JWT with bcrypt password hashing
- **Payment**: Stitch EFT, Peach Payments cards, ZARP SEP-24 bridge, Flutterwave, Paystack
- **Blockchain**: Stellar Mainnet + Soroban workspace scaffolding
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate limiting

## Project Structure

```
backend/
├── src/
│   ├── controllers/          # Business logic controllers
│   │   ├── auth.controller.ts
│   │   ├── escrow.controller.ts
│   │   ├── wallet.controller.ts
│   │   ├── payment.controller.ts
│   │   ├── dispute.controller.ts
│   │   ├── chat.controller.ts
│   │   └── notification.controller.ts
│   ├── routes/              # API routes
│   │   ├── auth.routes.ts
│   │   ├── escrow.routes.ts
│   │   ├── wallet.routes.ts
│   │   ├── payment.routes.ts
│   │   ├── dispute.routes.ts
│   │   ├── chat.routes.ts
│   │   └── notification.routes.ts
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   └── notFound.middleware.ts
│   └── server.ts            # Server entry point
├── prisma/
│   └── schema.prisma        # Database schema
├── .env                     # Environment variables
├── .env.example             # Example environment variables
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies and scripts
└── README.md                # This file
```

## Installation

### Prerequisites
- Node.js 18 or higher
- PostgreSQL 12 or higher
- npm or yarn

### Steps

1. **Clone and install dependencies:**
```bash
cd backend
npm install
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Set up PostgreSQL database:**
```bash
# Create a PostgreSQL database
createdb safehaven_escrow

# Or update DATABASE_URL in .env to point to your database
```

4. **Generate Prisma client and run migrations:**
```bash
npm run prisma:generate
npm run prisma:migrate
```

5. **Build TypeScript:**
```bash
npm run build
```

## Development

### Start development server with auto-reload:
```bash
npm run dev
```

### Check health:
```bash
curl http://localhost:5000/health
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/profile` - Get user profile
- `PATCH /api/auth/profile` - Update user profile

### Escrow
- `POST /api/escrow` - Create escrow transaction
- `GET /api/escrow` - Get user's escrows
- `GET /api/escrow/:id` - Get specific escrow
- `PATCH /api/escrow/:id/status` - Update escrow status
- `POST /api/escrow/:id/release` - Release funds

### Wallet
- `GET /api/wallet/balance` - Get wallet balance
- `GET /api/wallet/transactions` - Get transaction history
- `POST /api/wallet/add-funds` - Add funds
- `POST /api/wallet/withdraw` - Withdraw funds
- `POST /api/wallet/transfer` - Transfer to another user

### Payments
- `POST /api/payments/initiate` - Initiate payment
- `GET /api/payments/history` - Payment history
- `POST /api/payments/refund` - Refund payment

### Stellar / Soroban
- `GET /api/stellar/network` - Current Stellar Mainnet and Soroban config summary
- `POST /api/stellar/bridge/zarp/deposit` - Build ZARP SEP-24 deposit session
- `POST /api/stellar/bridge/zarp/withdraw` - Build ZARP SEP-24 withdraw session

### Disputes
- `POST /api/disputes` - Create dispute
- `GET /api/disputes` - Get user's disputes
- `GET /api/disputes/:id` - Get dispute details
- `POST /api/disputes/:id/messages` - Add dispute message
- `POST /api/disputes/:id/resolve` - Resolve dispute

### Chat
- `GET /api/chat` - Get chat rooms
- `GET /api/chat/:escrowId/messages` - Get chat messages
- `POST /api/chat/:escrowId/messages` - Send message
- `PATCH /api/chat/:escrowId/read` - Mark messages as read

### Notifications
- `GET /api/notifications` - Get notifications
- `GET /api/notifications/unread/count` - Unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `DATABASE_URL` | PostgreSQL connection | `postgresql://user:pass@localhost/db` |
| `JWT_SECRET` | JWT signing secret | `your-secret-key` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:3000` |
| `STELLAR_RPC_URL` | Soroban RPC endpoint | `https://mainnet.sorobanrpc.com` |
| `SOROBAN_ESCROW_CONTRACT_ID` | Deployed Soroban escrow contract ID | `CC...` |
| `STITCH_API_KEY` | Stitch API key | `stitch_live_xxx` |
| `PEACH_ACCESS_TOKEN` | Peach Payments bearer token | `live_xxx` |
| `ZARP_SEP24_URL` | ZARP anchor interactive base URL | `https://anchor.zarp.com/sep24` |
| `FLUTTERWAVE_SECRET_KEY` | Flutterwave API key | `FLWSECK_TEST_xxx` |
| `PAYSTACK_SECRET_KEY` | Paystack API key | `sk_test_xxx` |

## Key Features Explained

### 1. **Escrow Transactions**
- Create escrow with buyer and seller
- Automatic 3% platform fee calculation
- Status tracking: PENDING_PAYMENT → FUNDED → IN_DELIVERY → DELIVERED → COMPLETED
- Automatic fund distribution on completion
- Refund handling for cancelled transactions

### 2. **Wallet System**
- Deposit funds via payment processor
- Withdraw to bank account
- Transfer between users
- Transaction history tracking
- Balance management

### 3. **Payment Processing**
- Stitch for EFT and bank collection flows in South Africa
- Peach Payments for local card checkout
- ZARP SEP-24 as the fiat-to-Stellar bridge for ZAR settlement
- Flutterwave and Paystack remain available for wider regional coverage
- Wallet payment processing plus provider callback handling

### 4. **Dispute Resolution**
- Open disputes for transaction issues
- Track dispute status (OPEN → RESOLVED)
- Multiple resolution options (REFUND_BUYER, PAY_SELLER, SPLIT)
- Dispute messaging system
- Automatic fund distribution based on resolution

### 5. **Real-time Chat**
- Socket.io for real-time messaging
- Escrow-specific chat rooms
- Message read status tracking
- Support for text, images, and documents
- Unread message counting

## Security Features

- ✅ **Password Hashing** - bcryptjs with salt rounds
- ✅ **JWT Tokens** - Secure token-based authentication
- ✅ **CORS** - Restrictive CORS configuration
- ✅ **Rate Limiting** - 100 requests per IP per 15 minutes
- ✅ **Helmet** - Security headers
- ✅ **Input Validation** - express-validator
- ✅ **Environment Variables** - Sensitive data in .env

## Database Schema

Key models:
- **User** - User accounts with roles and verification
- **Escrow** - Escrow transactions
- **Payment** - Payment records
- **WalletBalance** - User wallet balances
- **WalletTransaction** - Transaction history
- **Dispute** - Dispute records
- **DisputeMessage** - Dispute communications
- **ChatMessage** - Escrow chat messages
- **Notification** - User notifications

## Testing

```bash
# Run tests
npm run test

# Run linter
npm run lint

# Fix linting issues
npm run lint:fix
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Update all `.env` variables with production values
3. Use strong `JWT_SECRET`
4. Set up proper PostgreSQL backups
5. Configure SSL/TLS
6. Use process manager like PM2:
   ```bash
   npm run build
   pm2 start dist/server.js --name "safehaven-api"
   ```

## Contributing

Pull requests welcome! Please ensure:
- TypeScript strict mode passes
- Code is properly formatted
- New routes have corresponding controllers and models

## License

MIT

## Support

For issues and questions, please open an issue on GitHub or contact the team.
