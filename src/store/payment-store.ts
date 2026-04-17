import { create } from 'zustand';
import { PaymentResponse } from '@/lib/payment-client';

interface PaymentState {
  // Payment form state
  isLoading: boolean;
  error: string | null;
  lastPayment: PaymentResponse | null;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastPayment: (payment: PaymentResponse | null) => void;
  clearPaymentState: () => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  isLoading: false,
  error: null,
  lastPayment: null,

  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  setLastPayment: (payment) => set({ lastPayment: payment }),
  clearPaymentState: () =>
    set({ isLoading: false, error: null, lastPayment: null }),
}));
