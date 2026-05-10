'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { disputeApi } from '@/lib/api-services/dispute';

type QueueRisk = 'MODERATE_RISK' | 'LOW_RISK';

type QueueItem = {
  disputeId: string;
  escrowId: string;
  status: string;
  createdAt: string;
  ageMs: number;
  highValue: boolean;
  risk: QueueRisk;
  escrow?: {
    id: string;
    title: string;
    amount: number;
    currency: string;
    status: string;
  };
  initiator?: {
    id: string;
    name: string;
    email: string;
    completedTransactions: number;
    rating: number;
  };
  evidenceUrls?: string[];
};

function formatAge(ms: number) {
  if (ms < 0) return '0m';
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d`;
  if (h > 0) return `${h}h`;
  if (m > 0) return `${m}m`;
  return `${s}s`;
}

export default function AdminDisputesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const isAdmin = (session as any)?.user?.role === 'ADMIN';

  const [loading, setLoading] = useState(true);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [selectedDisputeId, setSelectedDisputeId] = useState<string | null>(null);
  const [selectedDispute, setSelectedDispute] = useState<any | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [pagination, setPagination] = useState<{ total: number; pages: number } | null>(null);

  const [resolution, setResolution] = useState<'REFUND_BUYER' | 'PAY_SELLER' | 'SPLIT'>('PAY_SELLER');
  const [refundAmount, setRefundAmount] = useState<number>(0);

  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string>('');

  const loadQueue = async (nextPage: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await disputeApi.getAdminQueue(nextPage, limit);
      const items: QueueItem[] = res.items ?? res.queue ?? [];
      setQueue(items);

      const p = res.pagination;
      setPagination(
        p
          ? {
              total: Number(p.total ?? items.length),
              pages: Number(p.pages ?? 1),
            }
          : { total: items.length, pages: 1 }
      );

      // Keep selection if still present; otherwise select first item
      const stillThere = selectedDisputeId
        ? items.some((i) => i.disputeId === selectedDisputeId)
        : false;

      if (!stillThere) {
        const first = items[0]?.disputeId ?? null;
        setSelectedDisputeId(first);
      }
    } catch (e: any) {
      setError(e?.error || e?.message || 'Failed to load disputes queue');
      setQueue([]);
      setPagination(null);
      setSelectedDisputeId(null);
      setSelectedDispute(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSelectedDispute = async (disputeId: string) => {
    setError('');
    try {
      const res = await disputeApi.getById(disputeId);
      setSelectedDispute(res.dispute ?? res);
    } catch (e: any) {
      setError(e?.error || e?.message || 'Failed to load dispute details');
      setSelectedDispute(null);
    }
  };

  useEffect(() => {
    if (status === 'loading') return;

    if (status === 'unauthenticated' || !isAdmin) {
      router.push('/dashboard');
      return;
    }

    void loadQueue(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, isAdmin, page]);

  useEffect(() => {
    if (!selectedDisputeId) {
      setSelectedDispute(null);
      return;
    }
    void loadSelectedDispute(selectedDisputeId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDisputeId]);

  const escrowAmount = selectedDispute?.escrow?.amount ?? selectedDispute?.escrow?.amountZar ?? 0;

  const canResolve = useMemo(() => {
    if (!selectedDisputeId) return false;
    if (!selectedDispute) return false;
    if (selectedDispute.status !== 'OPEN') return false;
    if (resolution === 'SPLIT') return refundAmount > 0 && refundAmount < Number(escrowAmount);
    return true;
  }, [selectedDisputeId, selectedDispute, resolution, refundAmount, escrowAmount]);

  const resolve = async () => {
    if (!selectedDisputeId || !selectedDispute) return;

    setResolving(true);
    setError('');
    try {
      const payload: any = {
        resolution,
        winnerId: undefined,
        refundAmount: resolution === 'SPLIT' ? refundAmount : undefined,
        notes: 'Admin master key resolution (MVP)',
      };

      await disputeApi.resolve(selectedDisputeId, payload.resolution, payload.winnerId, payload.refundAmount, payload.notes);
      // Refresh queue after resolution
      setSelectedDispute(null);
      await loadQueue(page);
      setSelectedDisputeId(null);
    } catch (e: any) {
      setError(e?.error || e?.message || 'Failed to resolve dispute');
    } finally {
      setResolving(false);
    }
  };

  const highValuePulse = () => (
    <span
      className="inline-flex items-center gap-2 px-2 py-1 rounded-full bg-red-500/10 text-red-600 font-semibold border border-red-500/20"
      title="High value (>= R10,000)"
    >
      <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
      High value
    </span>
  );

  return (
    <div className="app-container">
      <div className="container-max py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Senior Staff Disputes Queue</h1>
          <p className="text-gray-600 mt-1 text-sm">
            Weighted queue: high-value first, then oldest FIFO.
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 rounded-2xl border border-danger/30 bg-red-50 text-red-700 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Queue list */}
          <div className="lg:col-span-1 card-lg">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-bold text-gray-900">Queue</h2>
              <span className="text-xs text-gray-500">
                Page {page}{pagination ? ` / ${pagination.pages}` : ''}
              </span>
            </div>

            {loading ? (
              <div className="py-10 text-center text-gray-600 text-sm">Loading…</div>
            ) : queue.length === 0 ? (
              <div className="py-10 text-center text-gray-600 text-sm">No open disputes.</div>
            ) : (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-2">
                {queue.map((item) => {
                  const active = item.disputeId === selectedDisputeId;
                  return (
                    <button
                      key={item.disputeId}
                      type="button"
                      onClick={() => setSelectedDisputeId(item.disputeId)}
                      className={`w-full text-left p-3 rounded-2xl border transition ${
                        active ? 'bg-primary text-white border-primary' : 'bg-white border-gray-100 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-bold truncate">{item.escrow?.title ?? 'Deal'}</div>
                          <div className="text-xs opacity-90 mt-1">
                            {item.initiator?.name ?? 'User'} • {formatAge(item.ageMs)} ago
                          </div>
                          <div className="text-xs opacity-90 mt-1">
                            Risk: {item.risk === 'MODERATE_RISK' ? 'Moderate Risk' : 'Low Risk'}
                          </div>
                        </div>
                        <div className="shrink-0">
                          {item.highValue ? highValuePulse() : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600 font-semibold border border-gray-200">
                              Standard
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-xs opacity-90 mt-3">
                        Amount: {item.escrow?.currency ?? 'ZAR'}{' '}
                        {Number(item.escrow?.amount ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex items-center justify-between mt-4">
              <button
                type="button"
                className="btn-secondary btn-sm btn"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
              >
                Prev
              </button>
              <button
                type="button"
                className="btn-secondary btn-sm btn"
                onClick={() => setPage((p) => p + 1)}
                disabled={loading || (pagination ? page >= pagination.pages : false)}
              >
                Next
              </button>
            </div>
          </div>

          {/* Trial view */}
          <div className="lg:col-span-2 card-lg">
            <div className="flex items-start justify-between gap-4 mb-3">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Trial view</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Evidence wall + unified chat (MVP uses stored evidence URLs + dispute messages).
                </p>
              </div>
              {selectedDispute?.status === 'OPEN' && (
                <span className="badge-warning">Open</span>
              )}
              {selectedDispute?.status && selectedDispute.status !== 'OPEN' && (
                <span className="badge-success">Resolved</span>
              )}
            </div>

            {!selectedDispute ? (
              <div className="py-10 text-center text-gray-600 text-sm">
                Select a dispute from the queue to review.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm text-gray-600">Escrow</div>
                      <div className="font-bold text-gray-900 break-all">
                        {selectedDispute.escrow?.title ?? 'Deal'}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        Reference: {selectedDispute.escrow?.id ?? '—'}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs text-gray-500">Amount</div>
                      <div className="font-bold text-gray-900">
                        {selectedDispute.escrow?.currency ?? 'ZAR'}{' '}
                        {Number(selectedDispute.escrow?.amount ?? 0).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </div>

                  {selectedDispute?.evidenceUrls?.length ? (
                    <div className="mt-4">
                      <div className="text-sm font-bold text-gray-900 mb-2">Evidence wall</div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {selectedDispute.evidenceUrls.map((u: string, idx: number) => (
                          <a
                            key={`${u}-${idx}`}
                            href={u}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 rounded-2xl border border-gray-100 bg-white hover:bg-gray-50 text-sm text-primary break-all"
                          >
                            Evidence {idx + 1}
                          </a>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 text-sm text-gray-600">No evidence URLs stored.</div>
                  )}

                  {selectedDispute?.description && (
                    <div className="mt-4 text-sm text-gray-700">
                      <span className="font-semibold">Description:</span> {selectedDispute.description}
                    </div>
                  )}
                </div>

                <div className="p-4 border border-gray-100 rounded-2xl bg-white">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="text-sm font-bold text-gray-900">Unified chat</div>
                      <div className="text-xs text-gray-500 mt-1">Dispute messages (trial bundle)</div>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto pr-2 space-y-3">
                    {selectedDispute.messages?.length ? (
                      selectedDispute.messages.map((m: any) => (
                        <div key={m.id} className="p-3 rounded-2xl bg-gray-50 border border-gray-100">
                          <div className="text-xs text-gray-600 font-semibold">
                            {m.sender?.name ?? 'Trader'}
                          </div>
                          <div className="text-sm text-gray-900 mt-1 break-words">{m.message}</div>
                          <div className="text-[11px] text-gray-500 mt-1">
                            {m.createdAt ? new Date(m.createdAt).toLocaleString('en-ZA') : ''}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-sm text-gray-600">No messages yet.</div>
                    )}
                  </div>
                </div>

                {/* Action bar */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-2xl">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
                    <div>
                      <div className="font-bold text-gray-900">Action bar (Master Key)</div>
                      <div className="text-sm text-gray-600 mt-1">
                        Apply override: payout or refund decision.
                      </div>
                    </div>

                    <div className="text-xs text-gray-600">
                      Staff: Senior Auditor (MVP)
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      className={`btn-secondary btn ${resolution === 'PAY_SELLER' ? 'border-primary text-primary bg-white' : ''}`}
                      onClick={() => setResolution('PAY_SELLER')}
                      disabled={!canResolve || resolving}
                    >
                      RELEASE TO SELLER
                    </button>
                    <button
                      type="button"
                      className={`btn-secondary btn ${resolution === 'REFUND_BUYER' ? 'border-primary text-primary bg-white' : ''}`}
                      onClick={() => setResolution('REFUND_BUYER')}
                      disabled={!canResolve || resolving}
                    >
                      REFUND TO BUYER
                    </button>
                    <button
                      type="button"
                      className={`btn-secondary btn ${resolution === 'SPLIT' ? 'border-primary text-primary bg-white' : ''}`}
                      onClick={() => setResolution('SPLIT')}
                      disabled={!canResolve || resolving}
                    >
                      SPLIT
                    </button>
                  </div>

                  {resolution === 'SPLIT' && (
                    <div className="mt-3">
                      <label className="input-label" htmlFor="refund-amount">
                        Buyer refund amount (R)
                      </label>
                      <input
                        id="refund-amount"
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(Number(e.target.value))}
                        className="input"
                        disabled={resolving}
                      />
                      <div className="text-xs text-gray-600 mt-1">
                        Must be {'>'} 0 and less than deal amount.
                      </div>
                    </div>
                  )}

                  <div className="mt-4 flex gap-2 flex-col sm:flex-row">
                    <button
                      type="button"
                      className="btn-primary btn flex-1"
                      onClick={resolve}
                      disabled={!canResolve || resolving}
                    >
                      {resolving ? 'Resolving…' : 'Apply Master Key'}
                    </button>

                    <button
                      type="button"
                      className="btn-secondary btn flex-1"
                      onClick={() => {
                        // MVP: request more info not wired to backend yet.
                        setError('REQUEST MORE INFO is not implemented in this MVP backend.');
                      }}
                      disabled={resolving}
                    >
                      Request more info
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
