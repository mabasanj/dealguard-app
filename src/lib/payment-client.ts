/**
 * Payment Client
 * Handles communication with backend payment endpoints
 */

export interface PaymentInitRequest {
  amount: number;
  currency?: string;
  paymentMethod: string;
  provider?: string;
  description?: string;
  buyerId?: string;
  sellerId?: string;
  escrowId?: string;
}

export interface PaymentResponse {
  success: boolean;
  checkoutId: string;
  providerReference: string;
  paymentUrl: string;
  provider: string;
  status: string;
}

export interface PaymentVerifyRequest {
  checkoutId: string;
  transactionId?: string;
}

export interface PaymentVerifyResponse {
  success: boolean;
  status: 'completed' | 'pending' | 'failed';
  amount: number;
  transactionId: string;
}

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NEXT_PUBLIC_APP_URL ? 'https://dealguard-backend.onrender.com/api' : 'http://localhost:5000/api');

/**
 * Initiate a payment
 */
export async function initiatePayment(
  request: PaymentInitRequest
): Promise<PaymentResponse> {
  const response = await fetch(`${API_URL}/payments/initiate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Payment initiation failed');
  }

  return response.json();
}

/**
 * Verify a payment
 */
export async function verifyPayment(
  request: PaymentVerifyRequest
): Promise<PaymentVerifyResponse> {
  const response = await fetch(`${API_URL}/payments/verify`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Payment verification failed');
  }

  return response.json();
}

/**
 * Get available payment methods
 */
export async function getPaymentMethods(): Promise<string[]> {
  const response = await fetch(`${API_URL}/payments/methods`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch payment methods');
  }

  const data = await response.json();
  return data.methods || [];
}

/**
 * Get Stellar network info for display purposes
 */
export async function getStellarNetworkInfo() {
  const response = await fetch(`${API_URL}/stellar/network`, {
    method: 'GET',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch Stellar network info');
  }

  return response.json();
}

/**
 * Initiate ZARP crypto deposit (SEP-24)
 */
export async function initiateZarpDeposit(params: {
  assetCode: string;
  amount?: number;
  accountId: string;
}) {
  const response = await fetch(`${API_URL}/stellar/bridge/zarp/deposit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Deposit initiation failed');
  }

  return response.json();
}

/**
 * Initiate ZARP crypto withdrawal (SEP-24)
 */
export async function initiateZarpWithdrawal(params: {
  assetCode: string;
  amount: number;
  account: string;
  memo?: string;
}) {
  const response = await fetch(`${API_URL}/stellar/bridge/zarp/withdraw`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Withdrawal initiation failed');
  }

  return response.json();
}
