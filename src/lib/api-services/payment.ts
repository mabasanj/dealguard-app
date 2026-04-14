import { apiClient } from '../api-client';

export interface Payment {
  id: string;
  escrowId: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  createdAt: string;
  completedAt?: string;
}

export const paymentApi = {
  initiatePayment: async (
    escrowId: string,
    paymentMethod: string
  ): Promise<any> => {
    return apiClient.post('/payments/initiate', { escrowId, paymentMethod });
  },

  getPaymentHistory: async (page: number = 1, limit: number = 10): Promise<any> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    return apiClient.get(`/payments/history?${params.toString()}`);
  },

  verifyPayment: async (reference: string): Promise<any> => {
    return apiClient.post('/payments/verify', { reference });
  },

  refundPayment: async (paymentId: string, reason: string): Promise<any> => {
    return apiClient.post('/payments/refund', { paymentId, reason });
  },
};