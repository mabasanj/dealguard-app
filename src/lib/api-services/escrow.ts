import { apiClient } from '../api-client';

export interface Escrow {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: string;
  buyerId: string;
  sellerId: string;
  platformFee: number;
  reference: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  buyer: { id: string; name: string; email: string };
  seller: { id: string; name: string; email: string };
  payments: any[];
  dispute?: any;
}

export interface CreateEscrowData {
  title: string;
  description: string;
  amount: number;
  currency?: string;
  buyerId?: string;
  sellerId?: string;
  sellerEmail?: string;
  itemsCount?: number;
  terms?: string;
  location?: string;
  deliveryAddress?: string;
}

export const escrowApi = {
  create: async (data: CreateEscrowData): Promise<{ escrow: Escrow; message: string }> => {
    return apiClient.post('/escrow', data);
  },

  list: async (status?: string, page: number = 1, limit: number = 10): Promise<any> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', String(page));
    params.append('limit', String(limit));
    return apiClient.get(`/escrow?${params.toString()}`);
  },

  getById: async (id: string): Promise<{ escrow: Escrow }> => {
    return apiClient.get(`/escrow/${id}`);
  },

  updateStatus: async (
    id: string,
    status: string,
    notes?: string
  ): Promise<{ escrow: Escrow; message: string }> => {
    return apiClient.patch(`/escrow/${id}/status`, { status, notes });
  },

  releaseFunds: async (id: string): Promise<{ escrow: Escrow; message: string }> => {
    return apiClient.post(`/escrow/${id}/release`, {});
  },
};