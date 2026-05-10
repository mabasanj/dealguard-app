import { ReactNode } from 'react';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Admin Dashboard | DealGuard',
  description: 'Internal admin monitoring dashboard',
};

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {children}
    </div>
  );
}
