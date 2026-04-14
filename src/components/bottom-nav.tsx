'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();

  if (!session?.user) return null;

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 md:hidden z-40">
      <div className="flex justify-around items-center h-20">
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${
            isActive('/dashboard') ? 'text-primary' : 'text-gray-600'
          }`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z" />
          </svg>
          <span className="text-xs font-medium">Home</span>
        </Link>

        <Link
          href="/send"
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${
            isActive('/send') ? 'text-primary' : 'text-gray-600'
          }`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M16 6l2.29 2.29-4.58 4.58 4.58 4.58L16 19.14 9.86 13 16 6m-6 0H8v12h2V6z" />
          </svg>
          <span className="text-xs font-medium">Send</span>
        </Link>

        <Link
          href="/receive"
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${
            isActive('/receive') ? 'text-primary' : 'text-gray-600'
          }`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 18l2.29-2.29-4.58-4.58L8 6.86 14.14 13 8 18m6 0h2V6h-2v12z" />
          </svg>
          <span className="text-xs font-medium">Receive</span>
        </Link>

        <Link
          href="/wallet"
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${
            isActive('/wallet') ? 'text-primary' : 'text-gray-600'
          }`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18 6h-2c0-2.76-2.24-5-5-5s-5 2.24-5 5H6c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-2c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 9c2.76 0 5 2.24 5 5s-2.24 5-5 5-5-2.24-5-5 2.24-5 5-5z" />
          </svg>
          <span className="text-xs font-medium">Wallet</span>
        </Link>

        <Link
          href="/profile"
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition ${
            isActive('/profile') ? 'text-primary' : 'text-gray-600'
          }`}
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
          <span className="text-xs font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}
