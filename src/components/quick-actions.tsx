'use client';

import React from 'react';
import Link from 'next/link';

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  href: string;
  color: string;
}

const defaultActions: QuickAction[] = [
  {
    id: 'create-escrow',
    label: 'Create Escrow',
    href: '/send',
    color: 'bg-blue-100 text-blue-600',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M16 6l2.29 2.29-4.58 4.58 4.58 4.58L16 19.14 9.86 13 16 6m-6 0H8v12h2V6z" />
      </svg>
    ),
  },
  {
    id: 'share-profile',
    label: 'Share Trader Link',
    href: '/receive',
    color: 'bg-green-100 text-green-600',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M8 18l2.29-2.29-4.58-4.58L8 6.86 14.14 13 8 18m6 0h2V6h-2v12z" />
      </svg>
    ),
  },
  {
    id: 'escrow-release',
    label: 'Escrow Release',
    href: '/dashboard',
    color: 'bg-purple-100 text-purple-600',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
      </svg>
    ),
  },
  {
    id: 'wallet',
    label: 'Wallet Balance',
    href: '/wallet',
    color: 'bg-orange-100 text-orange-600',
    icon: (
      <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
        <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
      </svg>
    ),
  },
];

interface QuickActionsProps {
  actions?: QuickAction[];
}

export default function QuickActions({ actions = defaultActions }: QuickActionsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {actions.map((action) => (
        <Link
          key={action.id}
          href={action.href}
          className="card hover:shadow-md transition-all"
        >
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className={`w-12 h-12 rounded-full ${action.color} flex items-center justify-center mb-3`}>
              {action.icon}
            </div>
            <span className="text-sm font-medium text-gray-900">{action.label}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
