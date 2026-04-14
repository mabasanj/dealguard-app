'use client';

import React, { Suspense, useState } from 'react';
import Link from 'next/link';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setLoading(true);
      setError('');

      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      });

      if (!result?.ok) {
        setError(result?.error || 'Failed to login. Please check your credentials.');
        return;
      }

      router.push(callbackUrl);
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex justify-center mb-8">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
              S
            </div>
            <span className="text-xl font-bold text-gray-900">DealGuard</span>
          </Link>
        </div>

        {/* Form Card */}
        <form onSubmit={handleSubmit(onSubmit)} className="card-lg">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Welcome Back</h1>
          <p className="text-gray-600 mb-6">Sign in to your account to continue</p>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-2xl mb-6">
              <p className="text-red-800 font-medium text-sm">{error}</p>
            </div>
          )}

          {/* Email Input */}
          <div className="input-group mb-4">
            <label className="input-label">Email Address</label>
            <input
              type="email"
              placeholder="name@example.com"
              className={`input ${errors.email ? 'input-error' : ''}`}
              {...register('email')}
            />
            {errors.email && (
              <p className="error-text">{errors.email.message}</p>
            )}
          </div>

          {/* Password Input */}
          <div className="input-group mb-2">
            <label className="input-label">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              className={`input ${errors.password ? 'input-error' : ''}`}
              {...register('password')}
            />
            {errors.password && (
              <p className="error-text">{errors.password.message}</p>
            )}
          </div>

          {/* Forgot Password Link */}
          <Link href="/auth/forgot-password" className="text-primary hover:text-primary-dark text-sm font-medium mb-6 block">
            Forgot password?
          </Link>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary btn w-full mb-4 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Signing in...
              </>
            ) : (
              'Sign in'
            )}
          </button>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 text-sm">
            Don&apos;t have an account?{' '}
            <Link href="/auth/register" className="text-primary hover:text-primary-dark font-semibold">
              Sign up
            </Link>
          </p>
        </form>

        {/* Info Section */}
        <div className="mt-8 text-center text-gray-600 text-sm">
          <p>Secure sign-in with bank-level encryption</p>
        </div>
      </div>
    </div>
  );
}
