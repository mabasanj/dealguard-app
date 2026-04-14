'use client';

import React, { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  const handleLogout = async () => {
    setLoading(true);
    await signOut({ redirect: false });
    router.push('/');
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
          <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="card-lg mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">{session?.user?.name || 'User'}</h2>
              <p className="text-gray-600 text-sm">{session?.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Account Information</h3>

          <div className="space-y-4">
            <div className="card">
              <p className="text-gray-600 text-sm font-medium">Email Address</p>
              <p className="text-gray-900 font-medium mt-1">{session?.user?.email}</p>
            </div>

            <div className="card">
              <p className="text-gray-600 text-sm font-medium">Account Status</p>
              <p className="text-gray-900 font-medium mt-1">
                <span className="inline-flex items-center px-3 py-1 badge-success">
                  Active
                </span>
              </p>
            </div>

            <div className="card">
              <p className="text-gray-600 text-sm font-medium">Member Since</p>
              <p className="text-gray-900 font-medium mt-1">
                {new Date().toLocaleDateString('en-ZA', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="mb-8">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Settings</h3>

          <div className="space-y-3">
            <button className="w-full card hover:shadow-md transition-all text-left flex items-center justify-between">
              <span className="font-medium text-gray-900">Change Password</span>
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L12.17 12s.01.01 0 0L8.59 16.59z" />
              </svg>
            </button>

            <button className="w-full card hover:shadow-md transition-all text-left flex items-center justify-between">
              <span className="font-medium text-gray-900">Security Settings</span>
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L12.17 12s.01.01 0 0L8.59 16.59z" />
              </svg>
            </button>

            <button className="w-full card hover:shadow-md transition-all text-left flex items-center justify-between">
              <span className="font-medium text-gray-900">Notifications</span>
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L12.17 12s.01.01 0 0L8.59 16.59z" />
              </svg>
            </button>

            <button className="w-full card hover:shadow-md transition-all text-left flex items-center justify-between">
              <span className="font-medium text-gray-900">Privacy Policy</span>
              <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L12.17 12s.01.01 0 0L8.59 16.59z" />
              </svg>
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          disabled={loading}
          className="btn-danger btn w-full disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Logging out...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
              Logout
            </>
          )}
        </button>

        {/* Help Text */}
        <p className="text-xs text-gray-500 text-center mt-6">
          Version 1.0.0 • Made for South Africa 🇿🇦
        </p>
      </div>
    </div>
  );
}
