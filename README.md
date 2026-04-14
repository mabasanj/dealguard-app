# SafeHaven Escrow - Secure Trading Platform for Formal, Informal, B2B and P2P Traders

A comprehensive escrow application designed specifically for formal, informal, B2B and P2P traders to facilitate secure buying and selling with built-in dispute resolution, verification, and multiple payment methods.

## 🚀 Features

### Core Features
- **Secure Escrow Transactions** - Funds held safely until both parties confirm completion
- **User Verification** - ID verification for all users with SADC country compliance
- **Multiple Payment Methods** - Credit/Debit Cards, Bank Transfer, Instant EFT, Cryptocurrency, Mobile Money
- **Dispute Resolution** - Fair and transparent dispute handling system
- **Rating & Review System** - Build reputation through verified user feedback
- **Wallet Management** - Account balance and transaction history with multi-currency support
- **Transaction Tracking** - Real-time updates on transaction status

### Southern Africa Specific
- Multi-currency support (ZAR, BWP, NAD, MUR, MWK, MZN, RWF, SZL, TZS, UGX, ZMW, ZWL)
- Crypto and stablecoin support (BTC, ETH, USDT, USDC, BUSD, DAI)
- Passport verification for all SADC countries
- Mobile money integration (for countries that support it)
- Regional payment gateways (Flutterwave, Paystack)
- Cross-border trading within SADC region

## 📋 Tech Stack

- **Frontend Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Styling**: Tailwind CSS
- **Authentication**: NextAuth.js
- **Payment Processing**: Stripe
- **State Management**: Zustand
- **Validation**: Zod
- **Forms**: React Hook Form

## 🛠️ Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Stripe account (for payment processing)

### Step 1: Install Node.js
**Download and install Node.js 18 LTS:**

#### Option A: Microsoft Store (Recommended)
1. Open Microsoft Store
2. Search for "Node.js LTS"
3. Click "Get" to install

#### Option B: Official Website
1. Visit https://nodejs.org/
2. Download the LTS version (18.x.x)
3. Run the installer

#### Option C: Manual Download
```powershell
# Download installer
Invoke-WebRequest -Uri "https://nodejs.org/dist/v18.19.0/node-v18.19.0-x64.msi" -OutFile "$env:TEMP\nodejs-installer.msi"

# Run installer
Start-Process -FilePath "$env:TEMP\nodejs-installer.msi" -Wait
```

**Verify Installation:**
```bash
node --version  # Should show v18.x.x
npm --version   # Should show 9.x.x
```

### Step 2: Install Dependencies
```bash
cd Escrow
npm install
```
```

### Step 3: Setup Environment Variables
Create a `.env.local` file in the project root:

```bash
cp .env.local.example .env.local
```

Update the `.env.local` file with your configuration:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/escrow_db"

# NextAuth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Stripe (South Africa)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_YOUR_KEY"
STRIPE_SECRET_KEY="sk_test_YOUR_KEY"

# Email Service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-password"

# App Settings
NEXT_PUBLIC_APP_NAME="Escrow SA"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NODE_ENV="development"
```

Generate `NEXTAUTH_SECRET`:
```bash
openssl rand -base64 32
```

### Step 4: Setup Database
Create PostgreSQL database:
```sql
CREATE DATABASE escrow_db;
```

Run Prisma migrations:
```bash
npm run prisma:generate
npm run prisma:migrate
```

Optionally view/manage data:
```bash
npm run prisma:studio
```

### Step 5: Start Development Server
```bash
npm run dev
```

Visit `http://localhost:3000` in your browser.

## 📁 Project Structure

```
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── layout.tsx      # Root layout
│   │   ├── page.tsx        # Home page
│   │   └── globals.css     # Global styles
│   ├── components/          # Reusable components
│   │   └── providers.tsx   # App providers
│   ├── lib/                # Utility libraries
│   └── types/              # TypeScript definitions
├── prisma/
│   └── schema.prisma       # Database schema
├── public/                 # Static assets
├── package.json
├── tsconfig.json           # TypeScript config
├── tailwind.config.ts      # Tailwind config
├── next.config.js          # Next.js config
└── .env.local.example      # Environment variables template
```

## 🗄️ Database Schema

### Main Models
- **User** - Buyer, seller, or admin accounts with verification
- **Escrow** - Transaction management with status tracking
- **Payment** - Payment records with multiple methods support
- **Dispute** - Dispute resolution system
- **Review** - User ratings and feedback
- **WalletBalance** - Account balance management
- **Notification** - User notifications

## 🔐 Security Considerations

- Passwords hashed with bcryptjs
- JWT-based authentication
- HTTPS recommended for production
- Environment variables for sensitive data
- Prisma for SQL injection prevention
- Rate limiting (to be implemented)
- 2FA support (to be added)

## 🚢 Deployment

### Vercel Deployment (Recommended)
```bash
vercel deploy
```

### Manual Deployment
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Set environment variables in your hosting platform

## 📚 API Routes (To Be Implemented)

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/escrow/create` - Create escrow transaction
- `GET /api/escrow/[id]` - Get escrow details
- `POST /api/escrow/[id]/confirm` - Confirm escrow completion
- `POST /api/dispute/create` - Create dispute
- `POST /api/payment/process` - Process payment
- `GET /api/user/profile` - Get user profile

## 🤝 Contributing

Contributions are welcome! Please follow the coding standards and create pull requests for any improvements.

## 📄 License

This project is private and proprietary.

## 📞 Support

For support, please contact: support@escrowsa.co.za

## 🔄 Development Commands

```bash
# Development
npm run dev              # Start dev server
npm run build           # Build for production
npm start               # Start production server
npm run lint            # Run ESLint

# Database
npm run prisma:generate # Generate Prisma client
npm run prisma:migrate  # Run migrations
npm run prisma:studio   # Open Prisma Studio

# Other
npm run build           # Build Next.js
npm run lint            # Lint code
```

## 📝 Roadmap

- [ ] User authentication and verification
- [ ] Escrow transaction flow
- [ ] Payment gateway integration
- [ ] Dispute resolution system
- [ ] Review and rating system
- [ ] Admin dashboard
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] API documentation
- [ ] 2FA security
- [ ] KYC integration
- [ ] Regulatory compliance

---

**Escrow SA© 2026** - Secure Trading Made Simple
