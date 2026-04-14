import { apiClient } from '../api-client';

export interface ChatMessage {
  id: string;
  escrowId: string;
  senderId: string;
  sender: { id: string; name: string; image?: string };
  message: string;
  messageType: string;
  isRead: boolean;
  createdAt: string;
}

export interface ChatRoom {
  escrowId: string;
  title: string;
  status: string;
  otherUser: { id: string; name: string; image?: string };
  lastMessage?: any;
  unreadCount: number;
}

export const chatApi = {
  getMessages: async (escrowId: string, page: number = 1, limit: number = 50): Promise<any> => {
    const params = new URLSearchParams();
    params.append('page', String(page));
    params.append('limit', String(limit));
    return apiClient.get(`/chat/${escrowId}/messages?${params.toString()}`);
  },

  sendMessage: async (
    escrowId: string,
    message: string,
    messageType?: string,
    attachments?: string[]
  ): Promise<{ chatMessage: ChatMessage; message: string }> => {
    return apiClient.post(`/chat/${escrowId}/messages`, {
      message,
      messageType,
      attachments,
    });
  },

  markAsRead: async (escrowId: string): Promise<{ message: string }> => {
    return apiClient.patch(`/chat/${escrowId}/read`, {});
  },

  getUnreadCount: async (): Promise<{ unreadCount: number }> => {
    return apiClient.get('/chat/unread/count');
  },

  getChatRooms: async (): Promise<{ chatRooms: ChatRoom[] }> => {
    return apiClient.get('/chat');
  },
};