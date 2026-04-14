'use client';

import { useEffect, useState } from 'react';
import { escrowApi, walletApi, authApi } from '@/lib';
import type { User, Escrow } from '@/lib';

/**
 * Example: Escrow Creation Flow Component
 * 
 * This component demonstrates how to use the backend API
 * for creating an escrow transaction with proper error handling.
 */

export default function CreateEscrowExample() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Escrow | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    amount: '',
    buyerId: '',
    sellerId: '',
    deliveryAddress: '',
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Load current user on component mount
  const loadCurrentUser = async () => {
    try {
      const { user } = await authApi.getProfile();
      setCurrentUser(user);
    } catch (err) {
      setError('Failed to load user profile');
    }
  };

  useEffect(() => {
    loadCurrentUser();
  }, []);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'amount' ? parseFloat(value) || '' : value,
    }));
  };

  // Create escrow transaction
  const handleCreateEscrow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Validate form
      if (!formData.title || !formData.description || !formData.amount) {
        setError('Please fill in all required fields');
        setLoading(false);
        return;
      }

      // Check wallet balance
      const balanceResponse = await walletApi.getBalance();
      const requiredAmount = (formData.amount as any) * 1.03; // Including 3% fee

      if (balanceResponse.balance < requiredAmount) {
        setError(`Insufficient funds. Required: R${requiredAmount.toFixed(2)}, Available: R${balanceResponse.balance.toFixed(2)}`);
        setLoading(false);
        return;
      }

      // Create escrow
      const result = await escrowApi.create({
        title: formData.title,
        description: formData.description,
        amount: formData.amount as any,
        buyerId: formData.buyerId || currentUser?.id || '',
        sellerId: formData.sellerId,
        deliveryAddress: formData.deliveryAddress,
      });

      setSuccess(result.escrow);
      setFormData({
        title: '',
        description: '',
        amount: '',
        buyerId: '',
        sellerId: '',
        deliveryAddress: '',
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create escrow';
      setError(errorMessage);
      console.error('Error creating escrow:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create Escrow Transaction</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          <p className="font-semibold">Escrow Created Successfully!</p>
          <p>Reference: {success.reference}</p>
          <p>Amount: R{success.amount.toFixed(2)}</p>
        </div>
      )}

      <form onSubmit={handleCreateEscrow} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Item Title*</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            placeholder="e.g. iPhone 14 Pro"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Description*</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Describe the item"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Amount (ZAR)*</label>
          <input
            type="number"
            name="amount"
            value={formData.amount}
            onChange={handleChange}
            placeholder="50000"
            step="0.01"
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Platform fee: 3% (will be deducted from your wallet)
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Seller ID*</label>
          <input
            type="text"
            name="sellerId"
            value={formData.sellerId}
            onChange={handleChange}
            placeholder="Seller's user ID"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Delivery Address</label>
          <input
            type="text"
            name="deliveryAddress"
            value={formData.deliveryAddress}
            onChange={handleChange}
            placeholder="e.g. Johannesburg, South Africa"
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-2 rounded-md transition"
        >
          {loading ? 'Creating...' : 'Create Escrow'}
        </button>
      </form>

      {/* Example usage instructions */}
      <div className="mt-8 p-4 bg-gray-50 rounded-md">
        <h3 className="font-semibold mb-2">How to Use:</h3>
        <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside">
          <li>Fill in the item details</li>
          <li>Enter the seller&apos;s user ID</li>
          <li>Ensure you have sufficient wallet balance</li>
          <li>Click &quot;Create Escrow&quot;</li>
          <li>Share the reference with the seller</li>
          <li>Track the transaction status</li>
        </ol>
      </div>
    </div>
  );
}