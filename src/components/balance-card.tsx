'use client';

import React from 'react';

interface BalanceCardProps {
  balance: number;
  currency?: string;
  userName?: string;
  userEmail?: string;
}

export default function BalanceCard({
  balance,
  currency = 'ZAR',
  userName = 'User',
  userEmail = 'user@example.com',
}: BalanceCardProps) {
  return (
    <div className="bg-[#0D0D0D] text-white rounded-2xl p-6 shadow-xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Escrow Balance</p>
          <h2 className="text-4xl font-bold mt-2 tracking-tight">
            {currency} {balance.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
        </div>
        <div className="w-11 h-11 bg-primary/10 border border-primary/20 rounded-full flex items-center justify-center">
          <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      </div>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-white/40 text-xs">{userName}</p>
          <p className="text-white/30 text-xs">{userEmail}</p>
        </div>
        <div className="text-right">
          <p className="text-white/30 text-xs">Escrow account</p>
          <p className="text-white/60 text-sm font-mono tracking-wider">•••• •••• •••• 2024</p>
        </div>
      </div>
    </div>
  );
}
