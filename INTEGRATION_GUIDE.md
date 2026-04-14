# SafeHaven Escrow - Backend Integration Guide

## Overview

This guide explains how the backend Express API is integrated with the Next.js frontend and Flutter mobile app.

## Architecture

```
┌─────────────────────────────────────────────┐
│     SafeHaven Escrow Backend                │
│     (Express.js @ http://localhost:5000)    │
│                                             │
│  • Authentication                           │
│  • Escrow Management                        │
│  • Wallet                                   │
│  • Payments (Flutterwave/Paystack)          │
│  • Disputes                                 │
│  • Real-time Chat (Socket.io)               │
│  • Notifications                            │
└─────────────────────────────────────────────┘
         ↑                           ↑
         │                           │
    HTTP/JSON               HTTP/JSON + Socket.io
         │                           │
    ┌────▼────┐              ┌──────▼────┐
    │ Next.js  │              │  Flutter  │
    │Frontend  │              │  Mobile   │
    └──────────┘              └───────────┘
```

## Next.js Frontend Integration

### Setup

1. **Install Socket.io client** (if not already installed):
```bash
npm install socket.io-client
```

2. **Environment Variables** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
```

### API Services

All API services are located in `src/lib/api-services/`:

#### Authentication
```typescript
import { authApi } from '@/lib/api-services/auth';

// Register
const response = await authApi.register({
  email: 'user@example.com',
  password: 'password123',
  name: 'John Doe',
  role: 'BUYER'
});

// Login
const loginResponse = await authApi.login({
  email: 'user@example.com',
  password: 'password123'
});

// Get profile
const profile = await authApi.getProfile();

// Update profile
const updated = await authApi.updateProfile({
  name: 'Jane Doe',
  phone: '+1234567890'
});
```

#### Escrow Transactions
```typescript
import { escrowApi } from '@/lib/api-services/escrow';

// Create escrow
const escrow = await escrowApi.create({
  title: 'Laptop Sale',
  description: 'Used MacBook Pro',
  amount: 50000,
  buyerId: 'buyer-id',
  sellerId: 'seller-id',
  deliveryAddress: 'Johannesburg, SA'
});

// List escrows
const escrows = await escrowApi.list('PENDING', 1, 10);

// Get specific escrow
const details = await escrowApi.getById(escrowId);

// Update status
const updated = await escrowApi.updateStatus(escrowId, 'DELIVERED');

// Release funds
const completed = await escrowApi.releaseFunds(escrowId);
```

#### Wallet
```typescript
import { walletApi } from '@/lib/api-services/wallet';

// Get balance
const { balance } = await walletApi.getBalance();

// Add funds
await walletApi.addFunds(5000, 'CARD', 'ref123');

// Withdraw funds
await walletApi.withdrawFunds(1000, 'account-number', 'BANK_TRANSFER');

// Transfer to user
await walletApi.transferFunds('recipient@email.com', 2000, 'Payment for item');
```

#### Payments
```typescript
import { paymentApi } from '@/lib/api-services/payment';

// Initiate payment
const payment = await paymentApi.initiatePayment(escrowId, 'CARD');

// Get history
const history = await paymentApi.getPaymentHistory(1, 10);

// Refund
await paymentApi.refundPayment(paymentId, 'Item not received');
```

#### Disputes
```typescript
import { disputeApi } from '@/lib/api-services/dispute';

// Create dispute
const dispute = await disputeApi.create(escrowId, 'ITEM_NOT_RECEIVED', 'Description here');

// List disputes
const disputes = await disputeApi.list('OPEN', 1, 10);

// Add message
await disputeApi.addMessage(disputeId, 'Message text', 'TEXT');

// Resolve dispute
await disputeApi.resolve(disputeId, 'REFUND_BUYER', buyerId, 50000);
```

#### Chat
```typescript
import { chatApi } from '@/lib/api-services/chat';

// Get messages
const messages = await chatApi.getMessages(escrowId, 1, 50);

// Send message
const msg = await chatApi.sendMessage(escrowId, 'Hello!', 'TEXT');

// Mark as read
await chatApi.markAsRead(escrowId);

// Get chat rooms
const rooms = await chatApi.getChatRooms();
```

#### Notifications
```typescript
import { notificationApi } from '@/lib/api-services/notification';

// Get notifications
const notifs = await notificationApi.getNotifications(1, 20, false);

// Get unread count
const { unreadCount } = await notificationApi.getUnreadCount();

// Mark as read
await notificationApi.markAsRead(notificationId);

// Mark all as read
await notificationApi.markAllAsRead();
```

### Real-time Chat with Socket.io

```typescript
import { socketClient } from '@/lib/socket-client';

// Connect (after login)
await socketClient.connect(token);

// Join escrow chat room
socketClient.joinEscrow(escrowId);

// Listen for new messages
socketClient.on('new-message', (data) => {
  console.log('New message:', data);
});

// Send message
socketClient.sendMessage(escrowId, 'Hello!', userId);

// Leave room
socketClient.leaveEscrow(escrowId);

// Disconnect (on logout)
socketClient.disconnect();
```

## Flutter Mobile Integration

### Setup

1. **Environment Configuration**:

Create `lib/config/api_config.dart`:
```dart
class ApiConfig {
  static const String baseURL = 'http://localhost:5000/api';
  static const String socketURL = 'http://localhost:5000';
}
```

2. **Initialize Services in main.dart**:
```dart
final apiClient = ApiClient();
final authService = AuthService(apiClient);
final escrowService = EscrowService(apiClient);
// ... other services

// Load existing token on app start
await apiClient.loadToken();
```

### Using Services

#### Authentication
```dart
// Register
try {
  final result = await authService.register(
    email: 'user@example.com',
    password: 'password123',
    name: 'John Doe',
    role: 'BUYER',
  );
  // Token is automatically saved
} catch (e) {
  print('Registration error: $e');
}

// Login
try {
  final result = await authService.login(
    email: 'user@example.com',
    password: 'password123',
  );
  // Token is automatically saved
} catch (e) {
  print('Login error: $e');
}

// Get profile
try {
  final user = await authService.getProfile();
  print('User: ${user.name}');
} catch (e) {
  print('Error: $e');
}
```

#### Escrow
```dart
// Create escrow
final escrow = await escrowService.createEscrow(
  title: 'Laptop Sale',
  description: 'Used MacBook Pro',
  amount: 50000,
  buyerId: 'buyer-uuid',
  sellerId: 'seller-uuid',
  deliveryAddress: 'Johannesburg',
);

// List escrows
final escrows = await escrowService.listEscrows(
  status: 'FUNDED',
  page: 1,
  limit: 10,
);

// Get specific escrow
final details = await escrowService.getEscrow(escrowId);

// Update status
final updated = await escrowService.updateEscrowStatus(escrowId, 'DELIVERED');

// Release funds
final completed = await escrowService.releaseFunds(escrowId);
```

#### Wallet
```dart
// Get balance
final balance = await walletService.getBalance();
print('Balance: R${balance.toStringAsFixed(2)}');

// Add funds
await walletService.addFunds(
  amount: 5000,
  paymentMethod: 'CARD',
  reference: 'ref123',
);

// Withdraw
await walletService.withdrawFunds(
  amount: 1000,
  bankAccount: 'account-details',
);

// Transfer
await walletService.transferFunds(
  recipientEmail: 'recipient@email.com',
  amount: 2000,
  description: 'Payment for item',
);
```

#### Chat
```dart
// Get messages
final messages = await chatService.getMessages(escrowId, page: 1);

// Send message
final msg = await chatService.sendMessage(
  escrowId: escrowId,
  message: 'Hello!',
  messageType: 'TEXT',
);

// Mark as read
await chatService.markAsRead(escrowId);

// Get chat rooms
final rooms = await chatService.getChatRooms();
```

## Common Integration Patterns

### 1. Error Handling

**Next.js:**
```typescript
try {
  const response = await escrowApi.create(data);
  // Success
} catch (error) {
  if (error instanceof ApiError) {
    console.error(error.error);
    if (error.statusCode === 401) {
      // Redirect to login
      router.push('/login');
    }
  }
}
```

**Flutter:**
```dart
try {
  final escrow = await escrowService.createEscrow(...);
} catch (e) {
  if (e.toString().contains('Unauthorized')) {
    // Navigate to login
    Navigator.of(context).pushReplacementNamed('/login');
  } else {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text('Error: $e')),
    );
  }
}
```

### 2. Token Management

Tokens are automatically managed in both apps:
- **Next.js**: Stored in `localStorage` via `apiClient.setToken()`
- **Flutter**: Stored in secure storage via `apiClient.setToken()`

To logout:
```typescript
// Next.js
authApi.logout();

// Flutter
authService.logout();
```

### 3. Pagination

All list endpoints support pagination:
```typescript
// Next.js
const page1 = await escrowApi.list('PENDING', 1, 10);
const page2 = await escrowApi.list('PENDING', 2, 10);

// Flutter
final escrows = await escrowService.listEscrows(page: 1, limit: 10);
```

### 4. Type Safety

Both apps use strong typing:
- **Next.js**: TypeScript interfaces for all responses
- **Flutter**: Dart models with `fromJson()` factory constructors

## Backend Configuration for Integration

Ensure the Express backend has:

1. **CORS enabled** in `.env`:
```env
FRONTEND_URL=http://localhost:3000
```

2. **Socket.io configured** for real-time features

3. **All API endpoints** returning proper JSON responses

4. **Authentication** via JWT tokens in Authorization header

## Troubleshooting

### 401 Unauthorized
- Check token is being sent with every request
- Verify `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_SOCKET_URL` in `.env.local`
- Ensure JWT token is valid and not expired

### CORS Errors
- Verify backend CORS is configured for frontend URL
- Use proper headers in API client

### Socket.io Connection Issues
- Verify Socket.io server is running
- Check `NEXT_PUBLIC_SOCKET_URL` matches backend

### Network Errors
- Confirm backend server is running on port 5000
- Check firewall settings
- Use `http://192.168.x.x:5000` for mobile testing instead of `localhost`

## Development Workflow

1. **Start Backend**:
   ```bash
   cd backend
   npm run dev
   ```

2. **Start Frontend**:
   ```bash
   npm run dev
   ```

3. **Start Mobile**:
   ```bash
   flutter run
   ```

4. **Test Integration**:
   - Register user in frontend
   - Create escrow
   - Test real-time chat with Socket.io
   - Verify all API calls work
