import { apiClient } from '../api-client';

export interface WalletBalance {
  balance: number;
}

export interface WalletTransaction {
  id: string;
  userId: string;
  amount: number;
  type: string;
  description: string;
  createdAt: string;
}

export const walletApi = {
  getBalance: async (): Promise<WalletBalance> => {
    return apiClient.get('/wallet/balance');
  },

  getTransactions: async (page: number = 1, limit: number = 20, type?: string): Promise<any> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    if (type) params.append('type', type);
    return apiClient.get(`/wallet/transactions?${params.toString()}`);
  },

  addFunds: async (
    amount: number,
    paymentMethod: string,
    reference?: string
  ): Promise<{ message: string; amount: number }> => {
    return apiClient.post('/wallet/add-funds', { amount, paymentMethod, reference });
  },

  withdrawFunds: async (
    amount: number,
    bankAccount: string,
    paymentMethod: string = 'BANK_TRANSFER'
  ): Promise<{ message: string; amount: number }> => {
    return apiClient.post('/wallet/withdraw', { amount, bankAccount, paymentMethod });
  },

  transferFunds: async (
    recipientEmail: string,
    amount: number,
    description?: string
  ): Promise<any> => {
    return apiClient.post('/wallet/transfer', {
      recipientEmail,
      amount,
      description,
    });
  },
};

// Backward-compatible alias used by existing pages.
export const walletService = walletApi;