# DealGuard - Secure Escrow for Real Traders

**DealGuard** is a modern escrow platform built for informal traders, B2B sellers, and marketplace users across Southern Africa. It protects buyer and seller funds with a simple, secure release workflow designed for social commerce (WhatsApp, Facebook Marketplace, TikTok) and formal business trades.

---

## 🎯 Core Features

- **Secure Escrow Transactions** – Funds locked until both parties confirm
- **3% Flat Transaction Fee** – Clear, transparent pricing per transaction
- **Fast Settlement** – Blockchain-backed release with Stellar integration
- **Dispute Resolution** – Fair arbitration system for trade conflicts
- **Multi-Currency & Stablecoin Support** – ZAR, USD, Crypto, and more
- **Real-time Chat & Notifications** – Communicate securely within escrow
- **User Verification** – ID/Passport verification for SADC region
- **Built for Informal Trade** – UX designed for non-technical traders

---

## 🛠️ Tech Stack

| Component | Technology |
|-----------|------------|
| **Frontend** | Next.js 15, TypeScript, React, Tailwind CSS, NextAuth.js |
| **Backend** | Express, TypeScript, Prisma ORM, SQLite |
| **Real-time** | Socket.IO for live notifications and chat |
| **Blockchain** | Stellar SDK + Freighter wallet integration |
| **Auth** | NextAuth.js (credentials flow) + JWT |
| **Payments** | Stripe, Paystack, Flutterwave |
| **Database** | SQLite (dev), PostgreSQL (production ready) |

---

## 📋 Project Structure

```
dealguard/
├── src/                          # Frontend
│   ├── app/                      # Next.js app router pages
│   │   ├── api/                  # API proxy routes to backend
│   │   ├── auth/                 # Authentication pages
│   │   ├── dashboard/            # User dashboard
│   │   ├── pricing/              # Pricing page
│   │   └── [pages].tsx           # Other routes
│   ├── components/               # Reusable React components
│   ├── lib/                      # Utilities, API services
│   └── globals.css               # Tailwind styles
├── backend/
│   ├── src/
│   │   ├── controllers/          # Route handlers
│   │   ├── services/             # Business logic (Stellar, payments)
│   │   ├── routes/               # Express routes
│   │   ├── middleware/           # Auth, error handling
│   │   └── server.ts             # Server entry point
│   ├── prisma/
│   │   └── schema.prisma         # Database schema
│   └── package.json
├── package.json                  # Root scripts (merged dev/build)
├── tsconfig.json                 # TypeScript config
├── tailwind.config.ts            # Tailwind configuration
└── next.config.js                # Next.js configuration
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL or SQLite (SQLite included by default)
- `.env.local` file with configuration

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/mabasanj/dealguard-private.git
   cd dealguard
   ```

2. **Install dependencies:**
   ```bash
   npm install
   npm --prefix backend install
   ```

3. **Setup environment:**
   ```bash
   cp .env.local.example .env.local
   ```
   Update `.env.local` with your API keys (Stripe, NextAuth secret, etc.)

4. **Setup database:**
   ```bash
   npm run prisma:migrate
   npm run prisma:generate
   ```

5. **Start development (merged frontend + backend):**
   ```bash
   npm run dev:merged
   ```

   Or start separately:
   ```bash
   npm run dev              # Frontend on port 3000
   npm --prefix backend run dev:stable  # Backend on port 5001
   ```

6. **Access the app:**
   - Frontend: `http://localhost:3000`
   - Backend health: `http://localhost:5001/health`

---

## 📦 Build & Deployment

**Build both frontend and backend:**
```bash
npm run build:all
```

**Start production (after build):**
```bash
npm run start:merged
```

**Individual commands:**
```bash
npm run build              # Build frontend only
npm --prefix backend run build  # Build backend only
```

---

## 💰 Pricing Model

**Transaction Fee:** 3% per escrow transaction (excludes third-party charges like card networks, banks, or wallet providers).

Pricing page: `http://localhost:3000/pricing`

---

## 🔐 Environment Variables

Create `.env.local` in the project root:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"  # SQLite or PostgreSQL URL

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# API
NEXT_PUBLIC_API_BASE="/api"
BACKEND_URL="http://localhost:5001"

# Payments
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."

# Stellar
STELLAR_HORIZON_URL="https://horizon-testnet.stellar.org"
STELLAR_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"

# Email & Notifications
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-password"

# Misc
NODE_ENV="development"
FRONTEND_URL="http://localhost:3000"
```

---

## 🧪 Testing & Validation

**Smoke Tests:**
```bash
npm run smoke:integration    # Full integration test
npm --prefix backend run smoke:backend   # Backend lifecycle test
npm --prefix backend run smoke:stellar   # Stellar service test
```

**Linting:**
```bash
npm run lint
npm --prefix backend run lint
```

---

## 🔄 Key Features & Workflows

### Escrow Flow
1. **Create Escrow** – Buyer and seller agree on terms
2. **Fund Escrow** – Buyer deposits funds (3% fee charged)
3. **Delivery** – Goods/services exchanged
4. **Release** – Buyer confirms, funds released to seller (minus fee)

### Dispute Handling
- Either party can open a dispute during escrow
- Evidence submission (files, details)
- Manual or automated resolution
- Refund to buyer if unresolved

### Stellar Integration
- Transaction signing via Freighter wallet
- Secure fund release on blockchain
- Cross-border payments and settlement

---

## 📚 API Routes

### Authentication
- `POST /api/auth/login` – User login
- `POST /api/auth/register` – User registration
- `POST /api/auth/logout` – User logout

### Escrow
- `POST /api/escrow` – Create escrow transaction
- `GET /api/escrow` – List user escrows
- `GET /api/escrow/[id]` – Get escrow details
- `PATCH /api/escrow/[id]/status` – Update status
- `POST /api/escrow/[id]/release` – Release funds

### Payments
- `POST /api/payments/initiate` – Start payment
- `POST /api/payments/verify` – Verify payment callback
- `GET /api/payments/history` – Payment history

### Other
- `GET /api/wallet/balance` – Get wallet balance
- `GET /api/chat/[escrowId]/messages` – Chat messages
- `GET /api/disputes` – List disputes

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature`)
3. Commit your changes (`git commit -m "Add feature"`)
4. Push to the branch (`git push origin feature/your-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and proprietary. Contact the maintainers for usage rights.

---

## 📞 Support & Contact

- **Email:** support@dealguard.co.za
- **Issues:** GitHub Issues
- **Docs:** See `/docs` folder for detailed guides

---

## 🔄 Release Notes

### v0.1.0 (Current)
- ✅ Escrow transaction creation & management
- ✅ Stellar blockchain integration
- ✅ User authentication & verification
- ✅ Payment provider integration (Stripe, Paystack, Flutterwave)
- ✅ Dispute resolution system
- ✅ Real-time chat & notifications
- ✅ 3% transaction fee model
- ✅ Multi-currency support

---

**DealGuard © 2026** – Secure Trading Made Simple for Southern Africa 🇿🇦
