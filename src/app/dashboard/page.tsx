'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import BalanceCard from '@/components/balance-card';
import QuickActions from '@/components/quick-actions';
import EscrowReleasePanel from '@/components/escrow-release-panel';
import { walletService } from '@/lib/api-services/wallet';
import { escrowApi } from '@/lib/api-services/escrow';

export default function DashboardPage() {
  const { data: session, status } = useSession();

  const [balance, setBalance] = useState<number>(0);
  const [escrows, setEscrows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadWalletData = async () => {
    const response = await walletService.getBalance();
    setBalance(response.balance || 0);
  };

  const loadEscrows = async () => {
    const res = await escrowApi.list(undefined, 1, 10);
    setEscrows(res?.escrows ?? []);
  };

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login');
    }

    if (session?.user) {
      (async () => {
        setLoading(true);
        try {
          await Promise.all([loadWalletData(), loadEscrows()]);
        } finally {
          setLoading(false);
        }
      })();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, status]);

  const formatStatus = (s: string) => {
    switch (s) {
      case 'PENDING_PAYMENT':
        return 'Pending payment';
      case 'FUNDED':
        return 'Funded';
      case 'IN_DELIVERY':
        return 'In delivery';
      case 'DELIVERED':
        return 'Delivered';
      case 'DISPUTED':
        return 'Disputed';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      case 'REFUNDED':
        return 'Refunded';
      default:
        return s;
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {session?.user?.name || 'User'}!
          </h1>
          <p className="text-gray-600 mt-1">Manage your escrow deals and release actions</p>
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

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Actions</h2>
          <QuickActions />
        </div>

        {/* Escrow Release Flow */}
        <div className="mb-8">
          <EscrowReleasePanel />
        </div>

        {/* Recent Escrow Activity */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-gray-900">Recent Escrow Activity</h2>
            <a href="/escrows" className="text-primary hover:text-primary-dark text-sm font-medium">
              View All
            </a>
          </div>

          {escrows.length > 0 ? (
            <div className="space-y-3">
              {escrows.map((e) => (
                <Link
                  key={e.id}
                  href={`/escrow/${e.id}`}
                  className="card transaction-item hover:shadow-md transition"
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                      <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18 6h-2c0-2.76-2.24-5-5-5s-5 2.24-5 5H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 9c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z" />
                      </svg>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-gray-900 truncate">{e.title || 'Escrow deal'}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {e.buyer?.name || 'Buyer'} → {e.seller?.name || 'Seller'}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-1">
                    <p className="font-bold text-lg text-danger">
                      R{' '}
                      {Number(e.amount || 0).toLocaleString('en-ZA', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <span className="text-xs px-2 py-1 rounded-full font-medium bg-gray-100 text-gray-800 border border-gray-200">
                      {formatStatus(e.status)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="card text-center py-8">
              <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
              </svg>
              <p className="text-gray-500">No escrows yet</p>
              <p className="text-gray-400 text-sm mt-1">Create your first protected escrow deal to get started</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
