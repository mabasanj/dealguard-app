import axios from 'axios';

interface PaymentInitRequest {
  amount: number;
  email: string;
  reference: string;
  currency?: string;
}

interface PaymentVerifyResponse {
  status: boolean;
  message: string;
  data: {
    id: number;
    reference: string;
    status: string;
    amount: number;
    currency: string;
  };
}

export interface PaymentProvider {
  initializePayment(request: PaymentInitRequest): Promise<any>;
  verifyPayment(referenceOrTransactionId: string): Promise<any>;
}

// Paystack Payment Service
export class PaystackService implements PaymentProvider {
  private apiKey: string;
  private baseUrl = 'https://api.paystack.co';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async initializePayment(request: PaymentInitRequest) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        {
          amount: Math.round(request.amount * 100), // Convert to cents
          email: request.email,
          reference: request.reference,
          currency: request.currency || 'ZAR'
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.data,
        message: 'Payment initialized successfully'
      };
    } catch (error) {
      console.error('Paystack initialization error:', error);
      return {
        success: false,
        error: 'Failed to initialize payment'
      };
    }
  }

  async verifyPayment(reference: string): Promise<PaymentVerifyResponse | { success: false; error: string }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`
          }
        }
      );

      if (response.data.status && response.data.data.status === 'success') {
        return {
          status: true,
          message: 'Payment verified successfully',
          data: response.data.data
        };
      }

      return {
        status: false,
        message: 'Payment verification failed',
        data: response.data.data
      };
    } catch (error) {
      console.error('Paystack verification error:', error);
      return {
        success: false,
        error: 'Failed to verify payment'
      };
    }
  }

  async createTransferRecipient(
    account_number: string,
    bank_code: string,
    name: string
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transferrecipient`,
        {
          type: 'nuban',
          name,
          account_number,
          bank_code
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Paystack transfer recipient error:', error);
      return {
        success: false,
        error: 'Failed to create transfer recipient'
      };
    }
  }

  async initiateTransfer(
    recipient: number,
    amount: number,
    reference: string
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transfer`,
        {
          source: 'balance',
          recipient,
          amount: Math.round(amount * 100), // Convert to cents
          reference
        },
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Paystack transfer error:', error);
      return {
        success: false,
        error: 'Failed to initiate transfer'
      };
    }
  }
}

// Flutterwave Payment Service
export class FlutterwaveService implements PaymentProvider {
  private secretKey: string;
  private publicKey: string;
  private baseUrl = 'https://api.flutterwave.com/v3';

  constructor(secretKey: string, publicKey: string) {
    this.secretKey = secretKey;
    this.publicKey = publicKey;
  }

  async initializePayment(request: PaymentInitRequest) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/payments`,
        {
          tx_ref: request.reference,
          amount: request.amount,
          currency: request.currency || 'ZAR',
          customer: {
            email: request.email
          },
          redirect_url: `${process.env.FRONTEND_URL}/payment-callback`,
          customizations: {
            title: 'Escrow Payment',
            description: 'Pay for your escrow transaction'
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.data,
        message: 'Payment initialized successfully'
      };
    } catch (error) {
      console.error('Flutterwave initialization error:', error);
      return {
        success: false,
        error: 'Failed to initialize payment'
      };
    }
  }

  async verifyPayment(transactionId: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transactions/${transactionId}/verify`,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`
          }
        }
      );

      return {
        success: response.data.data.status === 'successful',
        data: response.data.data,
        message: response.data.message
      };
    } catch (error) {
      console.error('Flutterwave verification error:', error);
      return {
        success: false,
        error: 'Failed to verify payment'
      };
    }
  }

  async createTransfer(
    account_number: string,
    account_bank: string,
    amount: number,
    narration: string,
    reference: string
  ) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transfers`,
        {
          account_bank,
          account_number,
          amount,
          narration,
          reference,
          currency: 'ZAR'
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        data: response.data.data
      };
    } catch (error) {
      console.error('Flutterwave transfer error:', error);
      return {
        success: false,
        error: 'Failed to create transfer'
      };
    }
  }
}

// Stripe Payment Service
export class StripeService implements PaymentProvider {
  private secretKey: string;
  private stripe: any;

  constructor(secretKey: string) {
    this.secretKey = secretKey;
    // Note: In a real app, you would import and initialize Stripe
    // const Stripe = require('stripe');
    // this.stripe = new Stripe(secretKey);
  }

  async createPaymentIntent(amount: number, currency: string, email: string) {
    try {
      // Mock implementation - replace with actual Stripe SDK
      return {
        success: true,
        data: {
          client_secret: `pi_test_${Date.now()}`,
          amount,
          currency,
          email
        },
        message: 'Payment intent created'
      };
    } catch (error) {
      console.error('Stripe error:', error);
      return {
        success: false,
        error: 'Failed to create payment intent'
      };
    }
  }

  async initializePayment(request: PaymentInitRequest) {
    return this.createPaymentIntent(request.amount, request.currency || 'ZAR', request.email);
  }

  async confirmPayment(paymentIntentId: string) {
    try {
      // Mock implementation
      return {
        success: true,
        data: {
          id: paymentIntentId,
          status: 'succeeded'
        }
      };
    } catch (error) {
      console.error('Stripe confirmation error:', error);
      return {
        success: false,
        error: 'Failed to confirm payment'
      };
    }
  }

  async verifyPayment(paymentIntentId: string) {
    return this.confirmPayment(paymentIntentId);
  }

  async createTransfer(amount: number, destination: string, currency: string) {
    try {
      // Mock implementation
      return {
        success: true,
        data: {
          id: `tr_test_${Date.now()}`,
          amount,
          destination,
          currency
        }
      };
    } catch (error) {
      console.error('Stripe transfer error:', error);
      return {
        success: false,
        error: 'Failed to create transfer'
      };
    }
  }
}

// Factory function to get the appropriate payment service
export const getPaymentService = (provider: string): PaymentProvider => {
  switch (provider.toLowerCase()) {
    case 'paystack':
      return new PaystackService(process.env.PAYSTACK_SECRET_KEY || '');
    case 'flutterwave':
      return new FlutterwaveService(
        process.env.FLUTTERWAVE_SECRET_KEY || '',
        process.env.FLUTTERWAVE_PUBLIC_KEY || ''
      );
    case 'stripe':
      return new StripeService(process.env.STRIPE_SECRET_KEY || '');
    default:
      return new PaystackService(process.env.PAYSTACK_SECRET_KEY || '');
  }
};
