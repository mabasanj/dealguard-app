'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { zarpApi, ZarpBalance, ZarpAnchorInfo } from '@/lib/api-services/stellar';
import { sep24Api } from '@/lib/api-services/stellar';

// ─── Sub-components ───────────────────────────────────────────────────────────

function BalanceRow({ b }: { b: ZarpBalance }) {
  const label = b.assetCode || 'XLM';
  const isZarp = label === 'ZAR' || label === 'ZARP';
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold
          ${isZarp ? 'bg-primary/10 text-primary' : 'bg-gray-100 text-gray-600'}`}>
          {label.slice(0, 2)}
        </div>
        <div>
          <p className="font-semibold text-gray-900 text-sm">{label}</p>
          {b.assetType !== 'native' && (
            <p className="text-xs text-gray-400 font-mono truncate max-w-[160px]">{b.assetIssuer}</p>
          )}
        </div>
      </div>
      <p className="font-bold text-gray-900">{parseFloat(b.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 7 })}</p>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ZarpPage() {
  const { status } = useSession();
  const router = useRouter();

  const [anchorInfo, setAnchorInfo] = useState<ZarpAnchorInfo | null>(null);
  const [balances, setBalances] = useState<ZarpBalance[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form state — trustline
  const [trustlineSecret, setTrustlineSecret] = useState('');
  const [trustlineLoading, setTrustlineLoading] = useState(false);
  const [trustlineMsg, setTrustlineMsg] = useState('');

  // Form state — send payment
  const [sendSecret, setSendSecret] = useState('');
  const [sendDest, setSendDest] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendMemo, setSendMemo] = useState('');
  const [sendLoading, setSendLoading] = useState(false);
  const [sendMsg, setSendMsg] = useState('');

  // Form state — balances lookup
  const [lookupKey, setLookupKey] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);

  // Form state — deposit via SEP-24
  const [depositAccount, setDepositAccount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositMsg, setDepositMsg] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') redirect('/auth/login');
  }, [status]);

  const loadAnchorInfo = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const info = await zarpApi.info();
      setAnchorInfo(info);
    } catch (err: any) {
      setError(err?.message || 'Failed to load anchor info');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'authenticated') loadAnchorInfo();
  }, [status, loadAnchorInfo]);

  const handleLookupBalances = async () => {
    if (!lookupKey.trim()) return;
    setLookupLoading(true);
    setError('');
    try {
      const res = await zarpApi.balances(lookupKey.trim());
      setBalances(res.balances);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch balances');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleAddTrustline = async () => {
    if (!trustlineSecret.trim()) { setTrustlineMsg('Secret key is required'); return; }
    setTrustlineLoading(true);
    setTrustlineMsg('');
    try {
      await zarpApi.addTrustline({ signingSecretKey: trustlineSecret });
      setTrustlineMsg('Trustline added successfully!');
      setTrustlineSecret('');
    } catch (err: any) {
      setTrustlineMsg(err?.message || 'Failed to add trustline');
    } finally {
      setTrustlineLoading(false);
    }
  };

  const handleSendPayment = async () => {
    if (!sendDest.trim() || !sendAmount.trim()) { setSendMsg('Destination and amount are required'); return; }
    setSendLoading(true);
    setSendMsg('');
    try {
      await zarpApi.send({
        sourceSecretKey: sendSecret || undefined,
        destination: sendDest,
        amount: sendAmount,
        memo: sendMemo || undefined,
      });
      setSendMsg('Payment sent!');
      setSendDest(''); setSendAmount(''); setSendMemo(''); setSendSecret('');
    } catch (err: any) {
      setSendMsg(err?.message || 'Failed to send payment');
    } finally {
      setSendLoading(false);
    }
  };

  const handleDeposit = async () => {
    if (!depositAccount.trim()) { setDepositMsg('Stellar account is required'); return; }
    setDepositLoading(true);
    setDepositMsg('');
    try {
      const authRes = await sep24Api.auth({ account: depositAccount });
      const session = await sep24Api.deposit({
        jwt: authRes.token,
        account: depositAccount,
        amount: depositAmount || undefined,
      });
      setDepositMsg(`Session started — ID: ${session.id}`);
      window.open(session.url, 'zarp-deposit', 'width=500,height=700,noopener,noreferrer');
    } catch (err: any) {
      setDepositMsg(err?.message || 'Failed to start deposit');
    } finally {
      setDepositLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="app-container">
      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-primary mb-4 text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <h1 className="text-2xl font-bold text-gray-900">ZARP Integration</h1>
          <p className="text-gray-500 mt-1 text-sm">Stellar-based ZAR payments via the ZARP anchor (SEP-24)</p>
        </div>

        {/* Anchor Info */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-gray-900">Anchor Info (SEP-1)</h2>
            <button onClick={loadAnchorInfo} disabled={loading} className="text-xs text-primary underline">
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          {error && <p className="text-sm text-red-600 mb-2">{error}</p>}
          {anchorInfo ? (
            <dl className="text-sm space-y-1">
              <div className="flex gap-2"><dt className="text-gray-500 w-32 shrink-0">Asset</dt><dd className="font-mono font-semibold">{anchorInfo.assetCode}</dd></div>
              {anchorInfo.assetIssuer && <div className="flex gap-2"><dt className="text-gray-500 w-32 shrink-0">Issuer</dt><dd className="font-mono text-xs break-all">{anchorInfo.assetIssuer}</dd></div>}
              <div className="flex gap-2"><dt className="text-gray-500 w-32 shrink-0">Transfer Server</dt><dd className="text-xs break-all">{anchorInfo.transferServer || '—'}</dd></div>
              <div className="flex gap-2"><dt className="text-gray-500 w-32 shrink-0">Auth Server</dt><dd className="text-xs break-all">{anchorInfo.authServer || '—'}</dd></div>
            </dl>
          ) : !loading && <p className="text-sm text-gray-400">No anchor info loaded.</p>}
        </div>

        {/* Balance Lookup */}
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-3">Account Balances</h2>
          <div className="flex gap-2 mb-4">
            <input
              type="text"
              placeholder="Stellar public key (G…)"
              value={lookupKey}
              onChange={(e) => setLookupKey(e.target.value)}
              className="input flex-1 font-mono text-xs"
            />
            <button onClick={handleLookupBalances} disabled={lookupLoading} className="btn-primary btn text-sm px-4">
              {lookupLoading ? '…' : 'Look up'}
            </button>
          </div>
          {balances.length > 0 && (
            <div>
              {balances.map((b, i) => <BalanceRow key={i} b={b} />)}
            </div>
          )}
        </div>

        {/* SEP-24 Deposit */}
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-1">Deposit ZAR (SEP-24)</h2>
          <p className="text-xs text-gray-500 mb-3">Deposit real ZAR via the ZARP anchor interactive flow</p>
          <label className="block text-sm text-gray-700 mb-1">Your Stellar Account</label>
          <input type="text" placeholder="G…" value={depositAccount} onChange={(e) => setDepositAccount(e.target.value)} className="input w-full mb-2 font-mono text-xs" />
          <label className="block text-sm text-gray-700 mb-1">Amount (optional)</label>
          <input type="number" placeholder="e.g. 500" value={depositAmount} onChange={(e) => setDepositAmount(e.target.value)} className="input w-full mb-3" />
          {depositMsg && <p className={`text-sm mb-2 ${depositMsg.startsWith('Session') ? 'text-green-600' : 'text-red-600'}`}>{depositMsg}</p>}
          <button onClick={handleDeposit} disabled={depositLoading} className="btn-primary btn w-full">
            {depositLoading ? 'Starting…' : 'Start Deposit'}
          </button>
        </div>

        {/* Add Trustline */}
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-1">Add ZARP Trustline</h2>
          <p className="text-xs text-gray-500 mb-3">Required before your account can hold ZARP tokens</p>
          <label className="block text-sm text-gray-700 mb-1">Signing Secret Key</label>
          <input type="password" placeholder="S…" value={trustlineSecret} onChange={(e) => setTrustlineSecret(e.target.value)} className="input w-full mb-3 font-mono text-xs" />
          {trustlineMsg && <p className={`text-sm mb-2 ${trustlineMsg.includes('success') ? 'text-green-600' : 'text-red-600'}`}>{trustlineMsg}</p>}
          <button onClick={handleAddTrustline} disabled={trustlineLoading} className="btn-primary btn w-full">
            {trustlineLoading ? 'Adding…' : 'Add Trustline'}
          </button>
        </div>

        {/* Send Payment */}
        <div className="card mb-6">
          <h2 className="font-semibold text-gray-900 mb-1">Send ZARP</h2>
          <p className="text-xs text-gray-500 mb-3">Transfer ZARP directly to another Stellar account</p>
          <label className="block text-sm text-gray-700 mb-1">Source Secret Key (optional if server key set)</label>
          <input type="password" placeholder="S…" value={sendSecret} onChange={(e) => setSendSecret(e.target.value)} className="input w-full mb-2 font-mono text-xs" />
          <label className="block text-sm text-gray-700 mb-1">Destination Public Key</label>
          <input type="text" placeholder="G…" value={sendDest} onChange={(e) => setSendDest(e.target.value)} className="input w-full mb-2 font-mono text-xs" />
          <label className="block text-sm text-gray-700 mb-1">Amount</label>
          <input type="number" placeholder="e.g. 100" value={sendAmount} onChange={(e) => setSendAmount(e.target.value)} className="input w-full mb-2" />
          <label className="block text-sm text-gray-700 mb-1">Memo (optional)</label>
          <input type="text" placeholder="Payment reference" value={sendMemo} onChange={(e) => setSendMemo(e.target.value)} className="input w-full mb-3" />
          {sendMsg && <p className={`text-sm mb-2 ${sendMsg === 'Payment sent!' ? 'text-green-600' : 'text-red-600'}`}>{sendMsg}</p>}
          <button onClick={handleSendPayment} disabled={sendLoading} className="btn-primary btn w-full">
            {sendLoading ? 'Sending…' : 'Send ZARP'}
          </button>
        </div>

      </div>
    </div>
  );
}
