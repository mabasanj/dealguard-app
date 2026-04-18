'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import BalanceCard from '@/components/balance-card';
import TransactionItem from '@/components/transaction-item';
import { walletService } from '@/lib/api-services/wallet';
import { sep24Api } from '@/lib/api-services/stellar';

// ─── SEP-24 Modal ─────────────────────────────────────────────────────────────

type Sep24Kind = 'deposit' | 'withdraw';

interface Sep24ModalProps {
  kind: Sep24Kind;
  onClose: () => void;
}

function Sep24Modal({ kind, onClose }: Sep24ModalProps) {
  const [stellarAccount, setStellarAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [interactiveUrl, setInteractiveUrl] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [jwt, setJwt] = useState('');
  const [pollStatus, setPollStatus] = useState('');

  const handleStart = async () => {
    if (!stellarAccount.trim()) {
      setError('Stellar account (public key) is required');
      return;
    }
    setError('');
    setLoading(true);
    try {
      // Step 1: SEP-10 auth
      const authRes = await sep24Api.auth({ account: stellarAccount });
      const token = authRes.token;
      setJwt(token);

      // Step 2: Start interactive session
      const sessionPayload = { jwt: token, account: stellarAccount, amount: amount || undefined };
      const session = kind === 'deposit'
        ? await sep24Api.deposit(sessionPayload)
        : await sep24Api.withdraw(sessionPayload);

      setInteractiveUrl(session.url);
      setTransactionId(session.id);

      // Open anchor interactive flow in a popup
      window.open(session.url, 'sep24-interactive', 'width=500,height=700,noopener,noreferrer');
    } catch (err: any) {
      setError(err?.message || 'Failed to start SEP-24 session');
    } finally {
      setLoading(false);
    }
  };

  const handlePollStatus = async () => {
    if (!transactionId || !jwt) return;
    setLoading(true);
    try {
      const res = await sep24Api.transactionStatus(transactionId, jwt);
      setPollStatus(res.transaction.status);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch status');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-xl font-bold text-gray-900 capitalize">{kind} ZARP (SEP-24)</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
        </div>

        {!interactiveUrl ? (
          <>
            <p className="text-sm text-gray-500 mb-4">
              {kind === 'deposit'
                ? 'Fund your Stellar wallet with ZAR via the ZARP anchor.'
                : 'Withdraw ZAR from your Stellar wallet back to your bank.'}
            </p>

            <label className="block text-sm font-medium text-gray-700 mb-1">Stellar Account (public key)</label>
            <input
              type="text"
              placeholder="G..."
              value={stellarAccount}
              onChange={(e) => setStellarAccount(e.target.value)}
              className="input w-full mb-3 font-mono text-xs"
            />

            <label className="block text-sm font-medium text-gray-700 mb-1">Amount (ZAR) — optional</label>
            <input
              type="number"
              placeholder="e.g. 500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="input w-full mb-4"
            />

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <button
              onClick={handleStart}
              disabled={loading}
              className="btn-primary btn w-full"
            >
              {loading ? 'Starting…' : `Start ${kind}`}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-gray-600 mb-3">
              A popup has opened for you to complete the {kind} with the anchor.
              Once done, click below to check the status.
            </p>

            <a
              href={interactiveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center text-sm text-primary underline mb-4"
            >
              Re-open anchor window
            </a>

            <p className="text-xs text-gray-400 mb-1">Transaction ID: <span className="font-mono">{transactionId}</span></p>

            {pollStatus && (
              <p className="text-sm font-medium mb-3">
                Status: <span className="capitalize text-primary">{pollStatus.replace(/_/g, ' ')}</span>
              </p>
            )}

            {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

            <button
              onClick={handlePollStatus}
              disabled={loading}
              className="btn-outline btn w-full mb-2"
            >
              {loading ? 'Checking…' : 'Check status'}
            </button>
            <button onClick={onClose} className="btn w-full text-sm text-gray-500">Done</button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Wallet Page ─────────────────────────────────────────────────────────────

export default function WalletPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [balance, setBalance] = useState<number>(0);
  const [transactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sep24Modal, setSep24Modal] = useState<Sep24Kind | null>(null);

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
      {sep24Modal && (
        <Sep24Modal kind={sep24Modal} onClose={() => setSep24Modal(null)} />
      )}
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
        <div className="grid grid-cols-2 gap-3 mb-6">
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

        {/* SEP-24 ZARP Stellar Actions */}
        <div className="card mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-gray-900 text-sm">Stellar / ZARP (SEP-24)</p>
              <p className="text-xs text-gray-500">Deposit or withdraw ZAR via the Stellar network</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setSep24Modal('deposit')}
              className="btn-primary btn w-full text-sm"
            >
              Deposit ZARP
            </button>
            <button
              onClick={() => setSep24Modal('withdraw')}
              className="btn-outline btn w-full text-sm"
            >
              Withdraw ZARP
            </button>
          </div>
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
