import { apiClient } from '../api-client';

export interface Dispute {
  id: string;
  escrowId: string;
  initiatorId: string;
  reason: string;
  description: string;
  status: string;
  createdAt: string;
  resolvedAt?: string;
}

export interface DisputeMessage {
  id: string;
  disputeId: string;
  senderId: string;
  sender: { id: string; name: string };
  message: string;
  createdAt: string;
}

export const disputeApi = {
  create: async (
    escrowId: string,
    reason: string,
    description: string,
    evidence?: string[]
  ): Promise<any> => {
    return apiClient.post('/disputes', { escrowId, reason, description, evidence });
  },

  list: async (status?: string, page: number = 1, limit: number = 10): Promise<any> => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', String(page));
    params.append('limit', String(limit));
    return apiClient.get(`/disputes?${params.toString()}`);
  },

  getById: async (id: string): Promise<any> => {
    return apiClient.get(`/disputes/${id}`);
  },

  addMessage: async (
    disputeId: string,
    message: string,
    messageType?: string,
    attachments?: string[]
  ): Promise<any> => {
    return apiClient.post(`/disputes/${disputeId}/messages`, {
      message,
      messageType,
      attachments,
    });
  },

  resolve: async (
    disputeId: string,
    resolution: string,
    winnerId?: string,
    refundAmount?: number,
    notes?: string
  ): Promise<any> => {
    return apiClient.post(`/disputes/${disputeId}/resolve`, {
      resolution,
      winnerId,
      refundAmount,
      notes,
    });
  },
};