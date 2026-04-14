import { apiClient } from '../api-client';

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  data?: any;
  isRead: boolean;
  createdAt: string;
}

export const notificationApi = {
  getNotifications: async (
    page: number = 1,
    limit: number = 20,
    unreadOnly: boolean = false
  ): Promise<any> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    params.append('unreadOnly', String(unreadOnly));
    return apiClient.get(`/notifications?${params.toString()}`);
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    return apiClient.get('/notifications/unread/count');
  },

  markAsRead: async (id: string): Promise<{ message: string }> => {
    return apiClient.patch(`/notifications/${id}/read`, {});
  },

  markAllAsRead: async (): Promise<{ message: string }> => {
    return apiClient.patch('/notifications/read-all', {});
  },

  delete: async (id: string): Promise<{ message: string }> => {
    return apiClient.delete(`/notifications/${id}`);
  },
};