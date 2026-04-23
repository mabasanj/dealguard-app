import { io, Socket } from 'socket.io-client';
import { getSocketServerUrl } from '@/lib/backend-url';

const SOCKET_SERVER_URL = getSocketServerUrl();

export interface SocketEvents {
  'new-message': (data: any) => void;
  'message-read': (data: any) => void;
  'escrow-updated': (data: any) => void;
  'notification': (data: any) => void;
  'user-online': (data: any) => void;
  'user-offline': (data: any) => void;
}

export interface SocketMethods {
  joinEscrow: (escrowId: string) => void;
  leaveEscrow: (escrowId: string) => void;
  sendMessage: (data: any) => void;
  markMessageRead: (data: any) => void;
  updateEscrowStatus: (data: any) => void;
}

class SocketClient {
  private socket: Socket | null = null;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.socket = io(SOCKET_SERVER_URL, {
        auth: {
          token,
        },
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
      });

      this.socket.on('connect', () => {
        console.log('Socket.io connected:', this.socket?.id);
        resolve();
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket.io connection error:', error);
        reject(error);
      });
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  // Join escrow-specific room for chat
  joinEscrow(escrowId: string): void {
    if (this.socket) {
      this.socket.emit('join-escrow', escrowId);
    }
  }

  // Leave escrow room
  leaveEscrow(escrowId: string): void {
    if (this.socket) {
      this.socket.emit('leave-escrow', escrowId);
    }
  }

  // Send message
  sendMessage(escrowId: string, message: string, senderId: string): void {
    if (this.socket) {
      this.socket.emit('send-message', {
        escrowId,
        message,
        senderId,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Listen for new messages
  on<K extends keyof SocketEvents>(event: K, callback: SocketEvents[K]): void {
    if (this.socket) {
      (this.socket as any).on(event, callback);
    }
  }

  // Stop listening
  off<K extends keyof SocketEvents>(event: K): void {
    if (this.socket) {
      (this.socket as any).off(event);
    }
  }

  // Emit custom event
  emit(event: string, data?: any): void {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }
}

export const socketClient = new SocketClient();