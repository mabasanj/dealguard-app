'use client';

import { PaymentMethod } from './payment-form';

interface PaymentMethodOption {
  id: PaymentMethod;
  name: string;
  description: string;
  icon: string;
  badge?: string;
}

interface PaymentMethodSelectorProps {
  selected: PaymentMethod;
  onChange: (method: PaymentMethod) => void;
  disabled?: boolean;
}

const paymentMethods: PaymentMethodOption[] = [
  {
    id: 'card',
    name: 'Credit/Debit Card',
    description: 'Visa, Mastercard',
    icon: '💳',
    badge: 'Popular',
  },
  {
    id: 'bank',
    name: 'Bank Transfer (EFT)',
    description: 'Direct from your account',
    icon: '🏦',
    badge: 'Instant',
  },
  {
    id: 'wallet',
    name: 'Digital Wallet',
    description: 'Paystack, Flutterwave',
    icon: '📱',
  },
  {
    id: 'crypto',
    name: 'Cryptocurrency',
    description: 'USDC, XLM via ZARP',
    icon: '₿',
    badge: 'New',
  },
];

export function PaymentMethodSelector({
  selected,
  onChange,
  disabled = false,
}: PaymentMethodSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {paymentMethods.map((method) => (
        <button
          key={method.id}
          type="button"
          onClick={() => onChange(method.id)}
          disabled={disabled}
          className={`p-3 rounded-xl border-2 transition-all text-left ${
            selected === method.id
              ? 'border-primary bg-primary/5'
              : 'border-gray-200 bg-white hover:border-gray-300'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-start justify-between gap-1 mb-1">
            <span className="text-xl">{method.icon}</span>
            {method.badge && (
              <span className="text-xs font-semibold px-2 py-0.5 bg-primary/10 text-primary rounded-full">
                {method.badge}
              </span>
            )}
          </div>
          <h4 className="font-semibold text-sm leading-tight">{method.name}</h4>
          <p className="text-xs text-gray-500">{method.description}</p>
        </button>
      ))}
    </div>
  );
}
