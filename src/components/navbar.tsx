'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';

export default function Navbar() {
  const { data: session } = useSession();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-[68px]">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-1.5 flex-shrink-0">
            <svg className="w-7 h-7 text-primary" viewBox="0 0 32 32" fill="currentColor">
              <path d="M16 2C8.268 2 2 8.268 2 16s6.268 14 14 14 14-6.268 14-14S23.732 2 16 2zm0 4a3 3 0 110 6 3 3 0 010-6zm0 20c-3.5 0-6.612-1.79-8.5-4.5.044-2.82 5.667-4.375 8.5-4.375s8.456 1.555 8.5 4.375C22.612 24.21 19.5 26 16 26z"/>
            </svg>
            <span className="font-bold text-[1.15rem] text-gray-900 tracking-tight">
              Deal<span className="text-primary">Guard</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-7">
            <Link href="/pricing" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition">
              Pricing
            </Link>
            <Link href="/send" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition">
              Create Escrow
            </Link>
            <Link href="/how-it-works" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition">
              How it works
            </Link>
            <Link href="/about" className="text-sm text-gray-600 hover:text-gray-900 font-medium transition">
              About
            </Link>
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {session?.user ? (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-gray-700 hover:text-primary transition px-3 py-2">
                  Dashboard
                </Link>
                <button onClick={handleLogout} className="text-sm font-medium text-gray-500 hover:text-gray-800 px-3 py-2 transition">
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 px-3 py-2 transition">
                  Log in
                </Link>
                <Link href="/auth/register" className="btn-primary btn px-5 py-2.5 text-sm rounded-full">
                  Get started
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2">
          <Link href="/pricing" className="block py-2.5 text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>Pricing</Link>
          <Link href="/send" className="block py-2.5 text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>Create Escrow</Link>
          <Link href="/how-it-works" className="block py-2.5 text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>How it works</Link>
          <Link href="/about" className="block py-2.5 text-sm font-medium text-gray-700 hover:text-primary" onClick={() => setMenuOpen(false)}>About</Link>
          <div className="pt-2 border-t border-gray-100 flex flex-col gap-2">
            {session?.user ? (
              <>
                <Link href="/dashboard" className="btn-secondary btn text-sm" onClick={() => setMenuOpen(false)}>Dashboard</Link>
                <button onClick={handleLogout} className="btn-secondary btn text-sm">Log out</button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="btn-secondary btn text-sm" onClick={() => setMenuOpen(false)}>Log in</Link>
                <Link href="/auth/register" className="btn-primary btn text-sm" onClick={() => setMenuOpen(false)}>Get started</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
