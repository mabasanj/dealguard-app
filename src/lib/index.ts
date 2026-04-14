// Re-export all API services for easy importing
export { apiClient } from './api-client';
export { authApi } from './api-services/auth';
export { escrowApi } from './api-services/escrow';
export { walletApi } from './api-services/wallet';
export { paymentApi } from './api-services/payment';
export { stellarApi, signWithFreighter } from './api-services/stellar';
export { disputeApi } from './api-services/dispute';
export { chatApi } from './api-services/chat';
export { notificationApi } from './api-services/notification';
export { socketClient } from './socket-client';

// Re-export types
export type { User } from './api-services/auth';
export type { Escrow, CreateEscrowData } from './api-services/escrow';
export type { WalletBalance, WalletTransaction } from './api-services/wallet';
export type { Payment } from './api-services/payment';
export type {
	StellarSetupEscrowPayload,
	StellarReleaseXdrPayload,
	StellarSubmitSignedXdrPayload,
	StellarReleaseFlowParams,
	StellarReleaseFlowResult,
	BuyerSignXdrFn,
} from './api-services/stellar';
export type { Dispute, DisputeMessage } from './api-services/dispute';
export type { ChatMessage, ChatRoom } from './api-services/chat';
export type { Notification } from './api-services/notification';