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

const normalizeFrontendBaseUrl = () => process.env.FRONTEND_URL || 'http://localhost:3000';

const buildRedirectUrl = (baseUrl: string, params: Record<string, string>) => {
  const searchParams = new URLSearchParams(params);
  return `${baseUrl}?${searchParams.toString()}`;
};

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

export class StitchService implements PaymentProvider {
  private apiKey: string;
  private redirectUrl: string;

  constructor(apiKey: string, redirectUrl?: string) {
    this.apiKey = apiKey;
    this.redirectUrl = redirectUrl || process.env.STITCH_REDIRECT_URL || `${normalizeFrontendBaseUrl()}/payments/stitch`;
  }

  async initializePayment(request: PaymentInitRequest) {
    if (!this.apiKey) {
      return {
        success: false,
        error: 'Stitch API key not configured'
      };
    }

    return {
      success: true,
      data: {
        checkout_url: buildRedirectUrl(this.redirectUrl, {
          provider: 'stitch',
          reference: request.reference,
          amount: request.amount.toFixed(2),
          currency: request.currency || 'ZAR'
        }),
        provider_reference: request.reference,
        collection_method: 'eft'
      },
      message: 'Stitch EFT collection session created'
    };
  }

  async verifyPayment(reference: string) {
    return {
      success: false,
      pending: true,
      data: {
        reference,
        status: 'pending_settlement'
      },
      message: 'Await Stitch webhook settlement confirmation before marking payment complete'
    };
  }
}

export class PeachPaymentsService implements PaymentProvider {
  private entityId: string;
  private accessToken: string;
  private checkoutUrl: string;

  constructor(entityId: string, accessToken: string, checkoutUrl?: string) {
    this.entityId = entityId;
    this.accessToken = accessToken;
    this.checkoutUrl = checkoutUrl || process.env.PEACH_CHECKOUT_URL || `${normalizeFrontendBaseUrl()}/payments/peach`;
  }

  async initializePayment(request: PaymentInitRequest) {
    if (!this.entityId || !this.accessToken) {
      return {
        success: false,
        error: 'Peach Payments credentials not configured'
      };
    }

    return {
      success: true,
      data: {
        checkout_url: buildRedirectUrl(this.checkoutUrl, {
          provider: 'peach',
          reference: request.reference,
          amount: request.amount.toFixed(2),
          currency: request.currency || 'ZAR'
        }),
        checkout_id: request.reference,
        entity_id: this.entityId
      },
      message: 'Peach Payments checkout created'
    };
  }

  async verifyPayment(reference: string) {
    return {
      success: false,
      pending: true,
      data: {
        reference,
        status: 'awaiting_capture'
      },
      message: 'Await Peach Payments webhook confirmation before marking payment complete'
    };
  }
}

export class ZarpRampService implements PaymentProvider {
  private baseUrl: string;
  private assetCode: string;
  private distributionAccount: string;

  constructor(baseUrl: string, assetCode: string, distributionAccount: string) {
    this.baseUrl = baseUrl;
    this.assetCode = assetCode;
    this.distributionAccount = distributionAccount;
  }

  async initializePayment(request: PaymentInitRequest) {
    if (!this.distributionAccount) {
      return {
        success: false,
        error: 'ZARP distribution account not configured'
      };
    }

    const interactiveUrl = buildRedirectUrl(`${this.baseUrl.replace(/\/$/, '')}/transactions/deposit/interactive`, {
      asset_code: this.assetCode || 'ZAR',
      account: this.distributionAccount,
      amount: request.amount.toFixed(2),
      memo: request.reference,
      memo_type: 'text',
      lang: 'en'
    });

    return {
      success: true,
      data: {
        interactive_url: interactiveUrl,
        asset_code: this.assetCode || 'ZAR',
        bridge: 'sep-24',
        anchor: 'zarp'
      },
      message: 'ZARP anchor deposit session created'
    };
  }

  async verifyPayment(reference: string) {
    return {
      success: false,
      pending: true,
      data: {
        reference,
        status: 'pending_anchor_confirmation'
      },
      message: 'Await ZARP anchor confirmation before marking bridge payment complete'
    };
  }
}

// Factory function to get the appropriate payment service
export const getPaymentService = (provider: string): PaymentProvider => {
  switch (provider.toLowerCase()) {
    case 'stitch':
      return new StitchService(
        process.env.STITCH_API_KEY || '',
        process.env.STITCH_REDIRECT_URL
      );
    case 'peach':
      return new PeachPaymentsService(
        process.env.PEACH_ENTITY_ID || '',
        process.env.PEACH_ACCESS_TOKEN || '',
        process.env.PEACH_CHECKOUT_URL
      );
    case 'zarp':
      return new ZarpRampService(
        process.env.ZARP_SEP24_URL || 'https://anchor.zarp.com/sep24',
        process.env.ZARP_ASSET_CODE || 'ZAR',
        process.env.ZARP_DISTRIBUTION_ACCOUNT || ''
      );
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
      return new StitchService(
        process.env.STITCH_API_KEY || '',
        process.env.STITCH_REDIRECT_URL
      );
  }
};
