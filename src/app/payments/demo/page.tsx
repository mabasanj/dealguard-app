'use client';

import { useState } from 'react';
import { PaymentForm, PaymentData } from '@/components/payment-form';
import { initiatePayment } from '@/lib/payment-client';
import { usePaymentStore } from '@/store/payment-store';

const METHOD_MAP: Record<string, string> = {
  card: 'CARD',
  bank: 'INSTANT_EFT',
  wallet: 'DIGITAL_WALLET',
  crypto: 'CRYPTO',
};

export default function PaymentDemoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setLastPayment, setError } = usePaymentStore();

  const handlePayment = async (data: PaymentData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await initiatePayment({
        amount: data.amount,
        currency: data.currency || 'ZAR',
        paymentMethod: METHOD_MAP[data.method] || data.method.toUpperCase(),
        description: data.description,
      });

      setLastPayment(response);

      // Redirect to payment provider
      if (response.paymentUrl) {
        window.location.href = response.paymentUrl;
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Payment failed';
      setError(errorMessage);
      console.error('Payment error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      <div className="container-max py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="headline-lg mb-2">Payment Gateway</h1>
          <p className="text-gray-600 mb-8">
            Make a payment using your preferred method. All transactions are
            processed securely through our payment partners.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Payment Form */}
            <div className="md:col-span-2">
              <PaymentForm onSubmit={handlePayment} isLoading={isSubmitting} />
            </div>

            {/* Info Panel */}
            <div className="space-y-4">
              <div className="card-lg">
                <h3 className="font-semibold mb-3">Supported Methods</h3>
                <ul className="space-y-2 text-sm">
                  <li>✓ Credit & Debit Cards</li>
                  <li>✓ Bank Transfers (EFT)</li>
                  <li>✓ Digital Wallets</li>
                  <li>✓ Cryptocurrency</li>
                </ul>
              </div>

              <div className="card-lg">
                <h3 className="font-semibold mb-3">Security</h3>
                <p className="text-sm text-gray-600">
                  All payments are encrypted and processed through trusted
                  payment partners. Your card data is never stored on our
                  servers.
                </p>
              </div>

              <div className="card-lg">
                <h3 className="font-semibold mb-3">Stellar Integration</h3>
                <p className="text-sm text-gray-600">
                  Payments can be funded through Stellar mainnet using the ZARP
                  crypto bridge for seamless fiat-to-crypto conversions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
