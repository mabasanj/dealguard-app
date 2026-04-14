# SafeHaven Escrow - Complete Setup Guide

## System Architecture

SafeHaven Escrow is a three-tier application:

1. **Backend**: Express.js REST API with Socket.io (Port: 5000)
2. **Frontend**: Next.js web application (Port: 3000)
3. **Mobile**: Flutter mobile application

## Prerequisites

### System Requirements
- Node.js 18+ and npm 11+
- PostgreSQL 12+
- Flutter SDK (for mobile development)
- Git

### Accounts Required
- Flutterwave developer account
- Paystack developer account
- Stripe account (optional)
- SMTP email service (Gmail, SendGrid, etc.)

## Backend Setup

### 1. Navigate to Backend
```bash
cd backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your configuration
```

Key variables to update:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Strong random string
- `FLUTTERWAVE_SECRET_KEY`: Your Flutterwave key
- `PAYSTACK_SECRET_KEY`: Your Paystack key
- `SMTP_USER` & `SMTP_PASS`: Email configuration

### 4. Set Up Database

```bash
# Create PostgreSQL database
createdb safehaven_escrow

# OR use connection string if server is running
psql -h localhost -U postgres -c "CREATE DATABASE safehaven_escrow;"
```

### 5. Run Prisma Setup
```bash
npm run prisma:generate
npm run prisma:migrate
```

### 6. Start Backend Server
```bash
npm run dev
```

Server will start at `http://localhost:5000`

Test health: `curl http://localhost:5000/health`

## Frontend Setup

### 1. Navigate to Frontend
```bash
cd ..
# You're now in the root Escrow directory
```

### 2. Install Dependencies (if not already installed)
```bash
npm install
```

### 3. Configure Environment
```bash
# Edit .env.local
nano .env.local
```

Ensure these variables are set:
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### 4. Start Frontend
```bash
npm run dev
```

Frontend will start at `http://localhost:3000`

## Mobile Setup

### 1. Navigate to Mobile Project
```bash
cd ../EscrowMobile
```

### 2. Get Flutter Packages
```bash
flutter pub get
```

### 3. Update API Configuration

Edit `lib/services/api_client.dart`:
```dart
// For Android emulator use:
static const String baseURL = 'http://10.0.2.2:5000/api';

// For iOS simulator use:
static const String baseURL = 'http://localhost:5000/api';

// For physical device, use:
static const String baseURL = 'http://YOUR_MACHINE_IP:5000/api';
```

### 4. Run Mobile App

**Android Emulator:**
```bash
flutter run
```

**iOS Simulator:**
```bash
flutter run -d ios
```

**Physical Device:**
```bash
flutter run -d <device_id>
```

## Testing the Integration

### 1. Test Backend API

```bash
# Health check
curl http://localhost:5000/health

# Register user
curl -X POST http://localhost:5000/api/auth \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "BUYER"
  }'
```

### 2. Test Frontend
- Navigate to `http://localhost:3000`
- Test registration and login
- Create an escrow transaction
- Test wallet functionality

### 3. Test Mobile App
- Register a user in the mobile app
- Create an escrow transaction
- Test real-time chat with frontend user
- Test notifications

## API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication
All requests (except registration/login) require:
```
Authorization: Bearer <token>
```

### Main Endpoints

#### Authentication
- `POST /auth` - Register/Login
- `GET /auth/profile` - Get user profile
- `PATCH /auth/profile` - Update profile

#### Escrow
- `POST /escrow` - Create escrow
- `GET /escrow` - List escrows
- `GET /escrow/:id` - Get escrow
- `PATCH /escrow/:id/status` - Update status
- `POST /escrow/:id/release` - Release funds

#### Wallet
- `GET /wallet/balance` - Get balance
- `GET /wallet/transactions` - Get transaction history
- `POST /wallet/add-funds` - Add funds
- `POST /wallet/withdraw` - Withdraw funds
- `POST /wallet/transfer` - Transfer to user

#### Payments
- `POST /payments/initiate` - Initiate payment
- `GET /payments/history` - Payment history
- `POST /payments/verify` - Verify payment

#### Disputes
- `POST /disputes` - Create dispute
- `GET /disputes` - List disputes
- `GET /disputes/:id` - Get dispute
- `POST /disputes/:id/messages` - Add message
- `POST /disputes/:id/resolve` - Resolve dispute

#### Chat
- `GET /chat` - Get chat rooms
- `GET /chat/:escrowId/messages` - Get messages
- `POST /chat/:escrowId/messages` - Send message
- `PATCH /chat/:escrowId/read` - Mark as read

#### Notifications
- `GET /notifications` - Get notifications
- `GET /notifications/unread/count` - Get unread count
- `PATCH /notifications/:id/read` - Mark as read
- `DELETE /notifications/:id` - Delete notification

## Development Workflow

### Terminal 1: Backend
```bash
cd backend
npm run dev
```

### Terminal 2: Frontend
```bash
npm run dev
```

### Terminal 3: Mobile (if testing)
```bash
cd EscrowMobile
flutter run
```

## Common Issues & Solutions

### Issue: Database Connection Error
**Solution**: 
- Ensure PostgreSQL is running
- Verify `DATABASE_URL` in `.env` is correct
- Run `npm run prisma:migrate` to create tables

### Issue: CORS Error from Frontend
**Solution**:
- Check `FRONTEND_URL` in backend `.env` matches frontend URL
- Verify backend is running on port 5000

### Issue: Socket.io Connection Fails
**Solution**:
- Check `NEXT_PUBLIC_SOCKET_URL` is correct
- Ensure backend Socket.io is initialized
- Check browser console for errors

### Issue: Mobile can't reach Backend
**Solution**:
- Use `10.0.2.2` for Android emulator
- Use `localhost` for iOS simulator
- Use machine IP for physical devices
- Ensure firewall allows port 5000

### Issue: Authentication Token Expired
**Solution**:
- Clear browser localStorage
- Log out and log back in
- Check JWT_SECRET is consistent

## Production Deployment

### Backend
```bash
# Build
npm run build

# Deploy with PM2
pm2 start dist/server.js --name "safehaven-api"

# Set environment to production
NODE_ENV=production
```

### Frontend
```bash
# Build
npm run build

# Deploy (e.g., Vercel)
npm run deploy
```

### Mobile
```bash
# Build APK (Android)
flutter build apk --release

# Build IPA (iOS)
flutter build ios --release
```

## Environment Files Checklist

### Backend (.env)
- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] FRONTEND_URL
- [ ] FLUTTERWAVE_SECRET_KEY
- [ ] PAYSTACK_SECRET_KEY
- [ ] SMTP credentials

### Frontend (.env.local)
- [ ] NEXT_PUBLIC_API_URL
- [ ] NEXT_PUBLIC_SOCKET_URL

### Mobile (api_client.dart)
- [ ] baseURL (for your setup)

## Security Notes

1. **Never commit .env files** - Use .env.example
2. **Use strong JWT_SECRET** - Generate with: `openssl rand -hex 32`
3. **Enable HTTPS** in production
4. **Validate all inputs** on backend
5. **Use HTTPS for API calls** in production
6. **Store tokens securely** (localStorage for web, Keychain for mobile)

## Performance Recommendations

1. **Enable Redis** for rate limiting
2. **Use database connection pooling**
3. **Implement caching** for frequently accessed data
4. **Use CDN** for static assets
5. **Enable compression** on API responses

## Support & Resources

- Backend README: `backend/README.md`
- Integration Guide: `INTEGRATION_GUIDE.md`
- API Documentation: `backend/README.md#API-Endpoints`
- Flutter Documentation: `EscrowMobile/README.md`

## Next Steps

1. Set up payment gateway webhooks
2. Configure email notifications
3. Set up file uploads (AWS S3)
4. Implement admin dashboard
5. Add comprehensive testing
6. Deploy to staging environment
7. Load testing and optimization
8. Production deployment

## Contact & Issues

For issues, check:
1. Backend logs: `backend/.logs`
2. Frontend console: Browser DevTools
3. Mobile logs: `flutter logs`
4. Database: `npm run prisma:studio`