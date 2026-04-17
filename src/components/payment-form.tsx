'use client';

import { useState } from 'react';
import { PaymentMethodSelector } from './payment-method-selector';

export type PaymentMethod = 'card' | 'bank' | 'crypto' | 'wallet';

interface PaymentFormProps {
  onSubmit?: (data: PaymentData) => void;
  isLoading?: boolean;
}

export interface PaymentData {
  method: PaymentMethod;
  amount: number;
  currency?: string;
  description?: string;
}

export function PaymentForm({ onSubmit, isLoading = false }: PaymentFormProps) {
  const [amount, setAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('card');
  const [currency, setCurrency] = useState('ZAR');
  const [description, setDescription] = useState('Escrow Payment');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount');
      return;
    }

    const paymentData: PaymentData = {
      method: selectedMethod,
      amount: parseFloat(amount),
      currency,
      description,
    };

    onSubmit?.(paymentData);
  };

  return (
    <form onSubmit={handleSubmit} className="card-lg max-w-md">
      <h2 className="headline-md mb-6">Make Payment</h2>

      {/* Payment Method Selection */}
      <div className="input-group mb-6">
        <label className="input-label">Payment Method</label>
        <PaymentMethodSelector
          selected={selectedMethod}
          onChange={setSelectedMethod}
          disabled={isLoading}
        />
      </div>

      {/* Amount Input */}
      <div className="input-group mb-4">
        <label className="input-label">Amount ({currency})</label>
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input flex-1"
            disabled={isLoading}
            required
          />
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="input"
            disabled={isLoading}
          >
            <option>ZAR</option>
            <option>USD</option>
            <option>EUR</option>
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="input-group mb-4">
        <label className="input-label">Description (Optional)</label>
        <input
          type="text"
          placeholder="What is this payment for?"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="input"
          disabled={isLoading}
        />
      </div>

      {/* Error Message */}
      {error && <div className="error-text mb-4">{error}</div>}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full"
      >
        {isLoading ? 'Processing...' : 'Continue to Payment'}
      </button>

      {/* Info Text */}
      <p className="text-xs text-gray-500 mt-4">
        Your payment will be securely processed by our payment providers. 
        Your information is encrypted and never stored.
      </p>
    </form>
  );
}
