'use client';

import React, { useState } from 'react';
import { stellarApi } from '@/lib';

export default function EscrowReleasePanel() {
  const [escrowPubKey, setEscrowPubKey] = useState('');
  const [sellerPubKey, setSellerPubKey] = useState('');
  const [amount, setAmount] = useState('100.0000000');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleRelease = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult('');

    try {
      const flow = await stellarApi.completeReleaseFlow({
        escrowPubKey,
        sellerPubKey,
        amount,
      });

      setResult(flow.submitResult?.message || 'Signed transaction submitted successfully');
    } catch (err: any) {
      const errorMsg = err?.error || err?.message || 'Failed to complete escrow release flow';
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card-lg">
      <h2 className="text-lg font-bold text-gray-900 mb-2">Escrow Release Flow</h2>
      <p className="text-sm text-gray-600 mb-4">
        Prepare release approval and finalize funds release securely.
      </p>

      <form onSubmit={handleRelease} className="space-y-3">
        <div className="input-group">
          <label className="input-label">Escrow Account Key</label>
          <input
            className="input"
            placeholder="G..."
            value={escrowPubKey}
            onChange={(e) => setEscrowPubKey(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Seller Account Key</label>
          <input
            className="input"
            placeholder="G..."
            value={sellerPubKey}
            onChange={(e) => setSellerPubKey(e.target.value)}
            required
          />
        </div>

        <div className="input-group">
          <label className="input-label">Amount</label>
          <input
            className="input"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>

        <button type="submit" className="btn-primary btn w-full" disabled={loading}>
          {loading ? 'Processing release...' : 'Run Escrow Release'}
        </button>
      </form>

      {error && (
        <div className="mt-4 p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-200 text-sm text-green-700">
          {result}
        </div>
      )}
    </div>
  );
}