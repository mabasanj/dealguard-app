'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import BalanceCard from '@/components/balance-card';
import TransactionItem from '@/components/transaction-item';
import { walletService } from '@/lib/api-services/wallet';

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [transactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login');
    }

    if (session?.user) {
      loadWalletData();
    }
  }, [session, status]);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const response = await walletService.getBalance();
      setBalance(response.balance || 0);

      // TODO: Fetch transactions
      // const txResponse = await walletService.getTransactions();
    } catch (error) {
      console.error('Error loading wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-6 md:max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-primary hover:text-primary-dark mb-4"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 12H5m7-7l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
          <p className="text-gray-600 mt-1">View your balance and transactions</p>
        </div>

        {/* Balance Card */}
        <div className="mb-8">
          <BalanceCard
            balance={balance}
            currency="ZAR"
            userName={session?.user?.name || 'User'}
            userEmail={session?.user?.email || ''}
          />
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="card text-center">
            <p className="text-gray-600 text-sm font-medium">Total In</p>
            <p className="text-xl font-bold text-green-600 mt-2">ZAR 0</p>
          </div>
          <div className="card text-center">
            <p className="text-gray-600 text-sm font-medium">Total Out</p>
            <p className="text-xl font-bold text-danger mt-2">ZAR 0</p>
          </div>
          <div className="card text-center">
            <p className="text-gray-600 text-sm font-medium">Transactions</p>
            <p className="text-xl font-bold text-primary mt-2">0</p>
          </div>
        </div>

        {/* Wallet Actions */}
        <div className="grid grid-cols-2 gap-3 mb-8">
          <button
            onClick={() => router.push('/send')}
            className="btn-primary btn w-full"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 6l2.29 2.29-4.58 4.58 4.58 4.58L16 19.14 9.86 13 16 6m-6 0H8v12h2V6z" />
            </svg>
            Send
          </button>
          <button
            onClick={() => router.push('/receive')}
            className="btn-outline btn w-full"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 18l2.29-2.29-4.58-4.58L8 6.86 14.14 13 8 18m6 0h2V6h-2v12z" />
            </svg>
            Receive
          </button>
        </div>

        {/* Transactions */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Transaction History</h2>

          {transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <TransactionItem
                  key={tx.id}
                  id={tx.id}
                  type={tx.type}
                  name={tx.name}
                  email={tx.email}
                  amount={tx.amount}
                  currency="ZAR"
                  date={tx.date}
                  status={tx.status}
                />
              ))}
            </div>
          ) : (
            <div className="card text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
              <p className="text-gray-500">No transactions yet</p>
              <p className="text-gray-400 text-sm mt-1">Start sending or receiving money</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
