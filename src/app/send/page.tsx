'use client';

import React, { useState } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { escrowApi } from '@/lib/api-services/escrow';

const createEscrowSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  sellerEmail: z.string().email('Invalid seller email'),
  amount: z.number().min(1, 'Amount must be greater than 0'),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  terms: z.string().optional(),
});

type CreateEscrowForm = z.infer<typeof createEscrowSchema>;

export default function SendPage() {
  const { status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateEscrowForm>({
    resolver: zodResolver(createEscrowSchema),
  });

  if (status === 'unauthenticated') {
    redirect('/auth/login');
  }

  const onSubmit = async (data: CreateEscrowForm) => {
    try {
      setLoading(true);
      setError('');

      await escrowApi.create({
        title: data.title,
        description: data.description,
        amount: data.amount,
        sellerEmail: data.sellerEmail,
        terms: data.terms,
        currency: 'ZAR',
      });

      setSuccess(true);
      reset();

      setTimeout(() => router.push('/dashboard'), 1800);
    } catch (err: any) {
      setError(err?.error || err?.message || 'Failed to create escrow');
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold text-gray-900">Create Escrow Deal</h1>
          <p className="text-gray-600 mt-1">Lock funds in protected escrow until delivery is confirmed</p>
        </div>

        {success ? (
          <div className="card-lg bg-green-50 border border-green-200">
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">Escrow Created!</h2>
              <p className="text-gray-600 text-center">Your escrow contract is now open. Redirecting to dashboard...</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Error Message */}
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-2xl">
                <p className="text-red-800 font-medium">{error}</p>
              </div>
            )}

            {/* Escrow Title */}
            <div className="input-group">
              <label className="input-label">Escrow Title</label>
              <input
                type="text"
                placeholder="Example: 20 iPhone 12 units"
                className={`input ${errors.title ? 'input-error' : ''}`}
                {...register('title')}
              />
              {errors.title && (
                <p className="error-text">{errors.title.message}</p>
              )}
            </div>

            {/* Seller Email */}
            <div className="input-group">
              <label className="input-label">Seller Email</label>
              <input
                type="email"
                placeholder="Enter seller email"
                className={`input ${errors.sellerEmail ? 'input-error' : ''}`}
                {...register('sellerEmail')}
              />
              {errors.sellerEmail && (
                <p className="error-text">{errors.sellerEmail.message}</p>
              )}
            </div>

            {/* Amount */}
            <div className="input-group">
              <label className="input-label">Amount (ZAR)</label>
              <div className="relative">
                <span className="absolute left-4 top-3 text-gray-600 font-medium">ZAR</span>
                <input
                  type="number"
                  placeholder="0.00"
                  className={`input pl-12 ${errors.amount ? 'input-error' : ''}`}
                  {...register('amount', { valueAsNumber: true })}
                  step="0.01"
                  min="0"
                />
              </div>
              {errors.amount && (
                <p className="error-text">{errors.amount.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="input-group">
              <label className="input-label">Deal Description</label>
              <textarea
                rows={3}
                placeholder="Describe goods, quantity, and delivery terms"
                className="input"
                {...register('description')}
              />
              {errors.description && (
                <p className="error-text">{errors.description.message}</p>
              )}
            </div>

            <div className="input-group">
              <label className="input-label">Escrow Terms (Optional)</label>
              <textarea
                rows={2}
                placeholder="Inspection period, quality conditions, release triggers"
                className="input"
                {...register('terms')}
              />
            </div>

            {/* Fee Notice */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl">
              <p className="text-sm text-blue-800">
                <span className="font-medium">Escrow protection:</span> funds stay locked until buyer confirms delivery or dispute is resolved.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary btn w-full disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating escrow...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M16 6l2.29 2.29-4.58 4.58 4.58 4.58L16 19.14 9.86 13 16 6m-6 0H8v12h2V6z" />
                  </svg>
                  Create Escrow
                </>
              )}
            </button>

            {/* Help Text */}
            <p className="text-xs text-gray-500 text-center">
              Use this for B2B bulk deals, marketplace trades, and social commerce transactions.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
