import { Request, Response } from 'express';
import { PrismaClient, TransactionType, PaymentMethod } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getWalletBalance = async (req: AuthRequest, res: Response) => {
  try {
    const balance = await prisma.walletBalance.findUnique({
      where: { userId: req.user!.id }
    });

    if (!balance) {
      // Create wallet if it doesn't exist
      const newBalance = await prisma.walletBalance.create({
        data: {
          userId: req.user!.id,
          amount: 0
        }
      });
      return res.json({ balance: newBalance.amount });
    }

    res.json({ balance: balance.amount });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getWalletTransactions = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, type } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = {
      userId: req.user!.id,
      ...(type && { transactionType: type as TransactionType })
    };

    const transactions = await prisma.walletTransaction.findMany({
      where,
      include: {
        escrow: {
          select: {
            id: true,
            title: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    });

    const total = await prisma.walletTransaction.count({ where });

    res.json({
      transactions,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addFunds = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { amount, paymentMethod, reference } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // In a real implementation, you would integrate with a payment processor
    // For now, we'll simulate the deposit

    await prisma.$transaction(async (tx) => {
      // Update wallet balance
      await tx.walletBalance.upsert({
        where: { userId: req.user!.id },
        update: { amount: { increment: amount } },
        create: { userId: req.user!.id, amount }
      });

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          userId: req.user!.id,
          amount,
          transactionType: 'DEPOSIT',
          paymentMethod: paymentMethod as PaymentMethod,
          description: `Wallet deposit via ${paymentMethod}`,
          reference
        }
      });
    });

    res.json({
      message: 'Funds added successfully',
      amount
    });
  } catch (error) {
    console.error('Add funds error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const withdrawFunds = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { amount, bankAccount, paymentMethod } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Check current balance
    const balance = await prisma.walletBalance.findUnique({
      where: { userId: req.user!.id }
    });

    if (!balance || balance.amount < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    // Check minimum withdrawal amount (e.g., R100)
    if (amount < 100) {
      return res.status(400).json({ error: 'Minimum withdrawal amount is R100' });
    }

    await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.walletBalance.update({
        where: { userId: req.user!.id },
        data: { amount: { decrement: amount } }
      });

      // Record transaction
      await tx.walletTransaction.create({
        data: {
          userId: req.user!.id,
          amount: -amount,
          transactionType: 'WITHDRAWAL',
          paymentMethod: paymentMethod as PaymentMethod,
          description: `Withdrawal to ${bankAccount}`,
          reference: `WD-${Date.now()}`
        }
      });
    });

    res.json({
      message: 'Withdrawal request submitted successfully',
      amount
    });
  } catch (error) {
    console.error('Withdraw funds error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const transferFunds = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { recipientEmail, amount, description } = req.body;

    if (amount <= 0) {
      return res.status(400).json({ error: 'Amount must be positive' });
    }

    // Find recipient
    const recipient = await prisma.user.findUnique({
      where: { email: recipientEmail }
    });

    if (!recipient) {
      return res.status(404).json({ error: 'Recipient not found' });
    }

    if (recipient.id === req.user!.id) {
      return res.status(400).json({ error: 'Cannot transfer to yourself' });
    }

    // Check sender balance
    const senderBalance = await prisma.walletBalance.findUnique({
      where: { userId: req.user!.id }
    });

    if (!senderBalance || senderBalance.amount < amount) {
      return res.status(400).json({ error: 'Insufficient funds' });
    }

    await prisma.$transaction(async (tx) => {
      // Deduct from sender
      await tx.walletBalance.update({
        where: { userId: req.user!.id },
        data: { amount: { decrement: amount } }
      });

      // Add to recipient
      await tx.walletBalance.upsert({
        where: { userId: recipient.id },
        update: { amount: { increment: amount } },
        create: { userId: recipient.id, amount }
      });

      // Record sender transaction
      await tx.walletTransaction.create({
        data: {
          userId: req.user!.id,
          amount: -amount,
          transactionType: 'TRANSFER_OUT',
          description: `Transfer to ${recipient.name}: ${description}`,
          recipientId: recipient.id
        }
      });

      // Record recipient transaction
      await tx.walletTransaction.create({
        data: {
          userId: recipient.id,
          amount,
          transactionType: 'TRANSFER_IN',
          description: `Transfer from ${req.user!.email}: ${description}`,
          recipientId: req.user!.id
        }
      });
    });

    res.json({
      message: 'Transfer completed successfully',
      amount,
      recipient: {
        id: recipient.id,
        name: recipient.name,
        email: recipient.email
      }
    });
  } catch (error) {
    console.error('Transfer funds error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};