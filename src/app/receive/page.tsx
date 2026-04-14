'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';

export default function ReceivePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [qrCode, setQrCode] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      redirect('/auth/login');
    }

    if (session?.user?.email) {
      // Generate QR code URL
      const receiveUrl = `${window.location.origin}/send?recipient=${encodeURIComponent(session.user.email)}`;
      const qrApi = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(receiveUrl)}`;
      setQrCode(qrApi);
    }
  }, [session, status]);

  const copyToClipboard = () => {
    if (session?.user?.email) {
      navigator.clipboard.writeText(session.user.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="app-container">
      <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8 py-6">
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
          <h1 className="text-2xl font-bold text-gray-900">Receive Escrow Requests</h1>
          <p className="text-gray-600 mt-1">Share your trader profile so buyers can open protected escrow deals</p>
        </div>

        {/* QR Code Section */}
        <div className="card-lg mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Scan to Start Escrow</h2>
          {qrCode && (
            <div className="flex justify-center">
              <img
                src={qrCode}
                alt="Receive QR Code"
                className="w-48 h-48 rounded-xl border-4 border-primary/10"
              />
            </div>
          )}
          <p className="text-center text-gray-600 text-sm mt-4">
            Buyers can scan this QR code to start an escrow transaction with you
          </p>
        </div>

        {/* Email Share Section */}
        <div className="card-lg mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Your Trader ID</h2>
          <div className="bg-gray-50 p-4 rounded-xl mb-4 break-all">
            <p className="text-center text-gray-900 font-mono">{session?.user?.email}</p>
          </div>
          <button
            onClick={copyToClipboard}
            className="btn-outline btn w-full mb-3"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
            </svg>
            {copied ? 'Copied!' : 'Copy Email'}
          </button>
        </div>

        {/* Share Options */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Share Escrow Link</h2>
          <div className="grid grid-cols-3 gap-3">
            <button
              onClick={() => {
                const text = `Start a protected escrow deal with me on SafeHave Escrow: ${session?.user?.email}`;
                window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
              }}
              className="card hover:shadow-md transition-all flex flex-col items-center justify-center py-4"
              title="Share via WhatsApp"
            >
              <span className="text-2xl mb-2">💬</span>
              <span className="text-xs font-medium">WhatsApp</span>
            </button>

            <button
              onClick={() => {
                const text = `Start a protected escrow deal with me on SafeHave Escrow: ${session?.user?.email}`;
                window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
              }}
              className="card hover:shadow-md transition-all flex flex-col items-center justify-center py-4"
              title="Share via Twitter"
            >
              <span className="text-2xl mb-2">𝕏</span>
              <span className="text-xs font-medium">Twitter</span>
            </button>

            <button
              onClick={() => {
                const text = `Start a protected escrow deal with me on SafeHave Escrow: ${session?.user?.email}`;
                window.open(`mailto:?subject=Start escrow trade&body=${encodeURIComponent(text)}`);
              }}
              className="card hover:shadow-md transition-all flex flex-col items-center justify-center py-4"
              title="Share via Email"
            >
              <span className="text-2xl mb-2">📧</span>
              <span className="text-xs font-medium">Email</span>
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="card-lg bg-blue-50 border border-blue-200 mt-8">
          <h3 className="font-medium text-blue-900 mb-2">How escrow flow works</h3>
          <ol className="text-sm text-blue-800 space-y-2">
            <li>1. Share your trader link on WhatsApp, Facebook Marketplace, or TikTok</li>
            <li>2. Buyer creates an escrow contract with amount and terms</li>
            <li>3. Funds stay locked until delivery confirmation</li>
            <li>4. Release happens after secure buyer approval</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
