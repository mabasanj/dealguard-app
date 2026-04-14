'use client';

import React from 'react';

interface TransactionItemProps {
  id: string;
  type: 'send' | 'receive' | 'escrow' | 'request';
  name: string;
  email: string;
  amount: number;
  currency?: string;
  date: string;
  status?: 'completed' | 'pending' | 'failed';
  avatar?: string;
}

export default function TransactionItem({
  type,
  name,
  email,
  amount,
  currency = 'ZAR',
  date,
  status = 'completed',
}: TransactionItemProps) {
  const isOutgoing = type === 'send' || type === 'escrow';
  const statusColors = {
    completed: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    failed: 'bg-red-100 text-red-800',
  };

  const getIcon = () => {
    switch (type) {
      case 'send':
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 6l2.29 2.29-4.58 4.58 4.58 4.58L16 19.14 9.86 13 16 6m-6 0H8v12h2V6z" />
            </svg>
          </div>
        );
      case 'receive':
        return (
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 18l2.29-2.29-4.58-4.58L8 6.86 14.14 13 8 18m6 0h2V6h-2v12z" />
            </svg>
          </div>
        );
      case 'escrow':
        return (
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M18 6h-2c0-2.76-2.24-5-5-5s-5 2.24-5 5H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 9c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z" />
            </svg>
          </div>
        );
      case 'request':
        return (
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="transaction-item">
      <div className="flex items-center gap-4 flex-1">
        {getIcon()}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-gray-900 truncate">{name}</p>
          <p className="text-sm text-gray-500">{email}</p>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1">
        <p className={`font-bold text-lg ${isOutgoing ? 'text-danger' : 'text-green-600'}`}>
          {isOutgoing ? '-' : '+'} {currency} {Math.abs(amount).toLocaleString('en-ZA', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{date}</span>
          <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColors[status]}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
}
