'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { escrowApi } from '@/lib/api-services/escrow';
import { disputeApi } from '@/lib/api-services/dispute';
import { chatApi } from '@/lib/api-services/chat';
import EvidenceWizard from '@/components/escrow/evidence-wizard';

function formatRemaining(ms: number): string {
  if (ms <= 0) return '0s';
  const s = Math.floor(ms / 1000);
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const parts: string[] = [];
  if (hours > 0) parts.push(`${hours}h`);
  if (minutes > 0 || hours > 0) parts.push(`${minutes}m`);
  parts.push(`${seconds}s`);
  return parts.join(' ');
}

export default function EscrowDetailPage() {
  const params = useParams<{ id: string }>();
  const escrowId = params?.id;
  const router = useRouter();

  const { data: session, status } = useSession();

  const [escrow, setEscrow] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const [activeEvidenceWizard, setActiveEvidenceWizard] = useState(false);
  const [dispute, setDispute] = useState<any | null>(null);

  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatPage] = useState(1);
  const [chatLimit] = useState(50);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);

  const [disputeMessageInput, setDisputeMessageInput] = useState('');
  const [disputeSending, setDisputeSending] = useState(false);

  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    const t = window.setInterval(() => setNowMs(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, []);

  const userId = (session as any)?.user?.id as string | undefined;
  const isAdmin = (session as any)?.user?.role === 'ADMIN';

  const isBuyer = escrow?.buyerId && userId ? escrow.buyerId === userId : false;
  const isSeller = escrow?.sellerId && userId ? escrow.sellerId === userId : false;

  const deliveredAt = escrow?.deliveredAt ? new Date(escrow.deliveredAt) : null;
  const graceDeadlineMs = useMemo(() => {
    if (!deliveredAt) return null;
    return deliveredAt.getTime() + 24 * 60 * 60 * 1000;
  }, [deliveredAt]);

  const remainingMs = useMemo(() => {
    if (!graceDeadlineMs) return null;
    return graceDeadlineMs - nowMs;
  }, [graceDeadlineMs, nowMs]);

  const inGraceWindow = remainingMs !== null ? remainingMs > 0 : false;

  const refreshEscrow = async () => {
    if (!escrowId) return;
    const res = await escrowApi.getById(escrowId);
    setEscrow(res.escrow ?? res.escrow);
  };

  const refreshDispute = async () => {
    const disputeId = escrow?.dispute?.id;
    if (!disputeId) {
      setDispute(null);
      return;
    }
    const full = await disputeApi.getById(disputeId);
    setDispute(full.dispute ?? full);
  };

  const refreshChat = async () => {
    if (!escrowId) return;
    const res = await chatApi.getMessages(escrowId, chatPage, chatLimit);
    setChatMessages(res.messages ?? []);
  };

  useEffect(() => {
    const run = async () => {
      try {
        if (status === 'unauthenticated') {
          router.push('/auth/login');
          return;
        }
        if (!escrowId) return;

        setLoading(true);
        const res = await escrowApi.getById(escrowId);
        setEscrow(res.escrow ?? res);

        // Fetch chat right away
        await refreshChat;
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escrowId, status]);

  useEffect(() => {
    if (escrow?.dispute?.id) {
      refreshDispute().catch(() => undefined);
    } else {
      setDispute(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [escrow?.dispute?.id]);

  const canBuyerApprove = escrow?.status === 'DELIVERED' && isBuyer && !dispute;
  const canBuyerDispute = escrow?.status === 'DELIVERED' && isBuyer && !dispute && inGraceWindow;

  const onApproveRelease = async () => {
    if (!escrowId) return;
    try {
      setLoading(true);
      await escrowApi.releaseFunds(escrowId);
      await refreshEscrow();
      setActiveEvidenceWizard(false);
      await refreshDispute();
    } finally {
      setLoading(false);
    }
  };

  const onSellerMarkDelivered = async () => {
    if (!escrowId || !isSeller) return;
    try {
      setLoading(true);
      await escrowApi.updateStatus(escrowId, 'DELIVERED', 'Courier marked as delivered');
      await refreshEscrow();
      await refreshDispute();
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  const onSellerMarkInDelivery = async () => {
    if (!escrowId || !isSeller) return;
    try {
      setLoading(true);
      await escrowApi.updateStatus(escrowId, 'IN_DELIVERY', 'Seller booked courier');
      await refreshEscrow();
      setLoading(false);
    } catch (e) {
      setLoading(false);
    }
  };

  const sendEscrowChat = async () => {
    if (!escrowId) return;
    const message = chatInput.trim();
    if (!message) return;

    try {
      setChatSending(true);
      await chatApi.sendMessage(escrowId, message, 'TEXT');
      setChatInput('');
      await refreshChat();
    } finally {
      setChatSending(false);
    }
  };

  const sendDisputeMessage = async () => {
    if (!dispute?.id) return;
    const message = disputeMessageInput.trim();
    if (!message) return;

    try {
      setDisputeSending(true);
      await disputeApi.addMessage(dispute.id, message, 'TEXT');
      setDisputeMessageInput('');
      await refreshDispute();
    } finally {
      setDisputeSending(false);
    }
  };

  if (loading) {
    return (
      <div className="app-container flex items-center justify-center">
        <div className="animate-spin">
          <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full" />
        </div>
      </div>
    );
  }

  if (!escrow) {
    return (
      <div className="app-container">
        <div className="container-max py-10">
          <div className="card-lg text-center">
            <p className="text-gray-600">Escrow not found.</p>
          </div>
        </div>
      </div>
    );
  }

  const statusLabel =
    escrow.status === 'DELIVERED'
      ? 'Delivered'
      : escrow.status === 'DISPUTED'
        ? 'Disputed'
        : escrow.status;

  return (
    <div className="app-container">
      <div className="container-max py-6">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center gap-2 text-primary hover:text-primary-dark text-sm font-medium mb-3"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 12H5m7-7l-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900">{escrow.title}</h1>
            <p className="text-gray-600 mt-1">
              Status: <span className="font-semibold">{statusLabel}</span>
            </p>
          </div>

          <div className="text-right">
            <div className="text-lg font-bold text-gray-900">
              {escrow.currency} {Number(escrow.amount).toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="text-xs text-gray-500 mt-1 break-all">{escrow.reference}</div>
          </div>
        </div>

        {/* Action / release panel */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="card-lg lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Delivery confirmation & release</h2>

            {escrow.status === 'DELIVERED' && (
              <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl mb-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-yellow-900">24-hour grace period active</p>
                    <p className="text-sm text-yellow-800 mt-1">
                      Buyer can approve & release or open a dispute until the timer ends.
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-yellow-900">Remaining</p>
                    <p className="text-2xl font-extrabold text-yellow-900">{remainingMs !== null ? formatRemaining(remainingMs) : '—'}</p>
                  </div>
                </div>
              </div>
            )}

            {escrow.status === 'IN_DELIVERY' && isSeller && (
              <p className="text-sm text-gray-600 mb-3">Waiting for courier delivery scan.</p>
            )}

            {!dispute && (
              <div className="flex flex-col sm:flex-row gap-3">
                {canBuyerApprove && (
                  <button
                    type="button"
                    onClick={onApproveRelease}
                    className="btn-primary btn w-full sm:w-auto"
                    disabled={loading}
                  >
                    Approve & Release
                  </button>
                )}

                {canBuyerDispute && (
                  <button
                    type="button"
                    onClick={() => setActiveEvidenceWizard(true)}
                    className="btn-secondary btn w-full sm:w-auto"
                  >
                    Dispute (Upload Evidence)
                  </button>
                )}

                {escrow.status === 'DELIVERED' && isBuyer && !canBuyerDispute && (
                  <div className="text-sm text-gray-600">
                    Grace period ended. You may still release if no dispute was opened.
                  </div>
                )}
              </div>
            )}

            {dispute && (
              <div className="mt-4">
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                  <p className="font-semibold text-gray-900">Dispute opened</p>
                  <p className="text-sm text-gray-600 mt-1">
                    Evidence submitted. SafeZAR agent will review and resolve.
                  </p>
                </div>
              </div>
            )}

            {isSeller && escrow.status === 'FUNDED' && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={onSellerMarkInDelivery}
                  className="btn-secondary btn w-full"
                >
                  Mark In Transit (Seller)
                </button>
              </div>
            )}

            {isSeller && escrow.status === 'IN_DELIVERY' && (
              <div className="mt-4">
                <button
                  type="button"
                  onClick={onSellerMarkDelivered}
                  className="btn-secondary btn w-full"
                >
                  Mark Delivered (Seller)
                </button>
              </div>
            )}
          </div>

          <div className="card-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Tri-View chat</h2>
            <p className="text-sm text-gray-600 mb-4">
              Messages are monitored by SafeZAR security.
            </p>

            <div className="space-y-2">
              <div className="text-xs text-gray-500">Buyer</div>
              <div className="text-sm font-medium text-gray-900 break-all">
                {escrow.buyer?.name} • {escrow.buyer?.email}
              </div>

              <div className="text-xs text-gray-500 pt-2">Seller</div>
              <div className="text-sm font-medium text-gray-900 break-all">
                {escrow.seller?.name} • {escrow.seller?.email}
              </div>

              {isAdmin && (
                <div className="mt-3 badge-warning">
                  Admin view
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Evidence wizard modal */}
        {activeEvidenceWizard && (
          <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-2xl">
              <EvidenceWizard
                escrowId={escrow.id}
                onClose={() => setActiveEvidenceWizard(false)}
                onResolved={async () => {
                  setActiveEvidenceWizard(false);
                  await refreshEscrow();
                  await refreshDispute();
                }}
              />
            </div>
          </div>
        )}

        {/* Chat */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="card-lg lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Escrow chat</h2>
            <div className="max-h-72 overflow-y-auto pr-2 space-y-2 border border-gray-100 rounded-2xl p-3 bg-white">
              {chatMessages.length === 0 ? (
                <div className="text-sm text-gray-500">No messages yet.</div>
              ) : (
                chatMessages.map((m) => {
                  const mine = m.senderId && userId ? m.senderId === userId : false;
                  return (
                    <div
                      key={m.id}
                      className={`flex ${mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-2xl px-3 py-2 border ${
                          mine ? 'bg-primary text-white border-primary' : 'bg-gray-50 text-gray-900 border-gray-200'
                        }`}
                      >
                        <div className="text-xs font-semibold opacity-90">
                          {mine ? 'You' : m.sender?.name || 'Trader'}
                        </div>
                        <div className="text-sm break-words mt-1">{m.message}</div>
                        <div className="text-[11px] opacity-70 mt-1">
                          {m.createdAt ? new Date(m.createdAt).toLocaleString('en-ZA') : ''}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex gap-2 mt-3">
              <input
                className="input"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Write a message…"
                disabled={chatSending}
              />
              <button
                type="button"
                className="btn-primary btn px-4"
                onClick={sendEscrowChat}
                disabled={chatSending}
              >
                {chatSending ? 'Sending…' : 'Send'}
              </button>
            </div>
          </div>

          {/* Dispute panel */}
          <div className="card-lg">
            <h2 className="text-lg font-bold text-gray-900 mb-2">Dispute</h2>

            {!dispute ? (
              <p className="text-sm text-gray-600">
                If something goes wrong, the buyer can open a dispute with evidence.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl">
                  <p className="font-semibold text-gray-900">Status: {dispute.status}</p>
                  {dispute.description && (
                    <p className="text-sm text-gray-600 mt-1">{dispute.description}</p>
                  )}
                  {dispute.evidenceUrls && Array.isArray(dispute.evidenceUrls) && (
                    <div className="mt-3">
                      <p className="text-xs text-gray-500 mb-2">Evidence links</p>
                      <ul className="space-y-2">
                        {dispute.evidenceUrls.map((u: string, idx: number) => (
                          <li key={`${u}-${idx}`}>
                            <a className="text-primary hover:text-primary-dark text-sm break-all" href={u} target="_blank" rel="noreferrer">
                              Evidence {idx + 1}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div className="border border-gray-100 rounded-2xl p-3 bg-white max-h-56 overflow-y-auto">
                  <div className="text-xs font-semibold text-gray-600 mb-2">Dispute messages</div>
                  {dispute.messages?.length ? (
                    <div className="space-y-2">
                      {dispute.messages.map((m: any) => (
                        <div key={m.id} className="text-sm">
                          <div className="font-semibold text-gray-900">
                            {m.sender?.name || 'Trader'}
                          </div>
                          <div className="text-gray-700 break-words">{m.message}</div>
                          <div className="text-[11px] text-gray-500">
                            {m.createdAt ? new Date(m.createdAt).toLocaleString('en-ZA') : ''}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500">No dispute messages yet.</div>
                  )}
                </div>

                {dispute.status === 'OPEN' && (
                  <div className="flex gap-2">
                    <input
                      className="input"
                      value={disputeMessageInput}
                      onChange={(e) => setDisputeMessageInput(e.target.value)}
                      placeholder="Add evidence clarification…"
                      disabled={disputeSending}
                    />
                    <button
                      type="button"
                      className="btn-primary btn px-4"
                      onClick={sendDisputeMessage}
                      disabled={disputeSending}
                    >
                      {disputeSending ? 'Sending…' : 'Send'}
                    </button>
                  </div>
                )}

                {isAdmin && (
                  <div className="text-xs text-gray-500">
                    Admin can resolve this dispute from the Senior Staff dashboard.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
