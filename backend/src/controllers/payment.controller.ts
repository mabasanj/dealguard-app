import { Request, Response } from 'express';
import { PrismaClient, PaymentStatus, PaymentMethod } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.middleware';
import { getPaymentService } from '../services/payment.service';

const prisma = new PrismaClient();

const isSuccessfulGatewayStatus = (status?: string) => {
  return ['successful', 'succeeded', 'completed', 'paid', 'settled'].includes((status || '').toLowerCase());
};

const resolvePaymentProvider = (paymentMethod: PaymentMethod, requestedProvider?: string) => {
  if (requestedProvider) {
    return requestedProvider.toLowerCase();
  }

  switch (paymentMethod) {
    case 'CARD':
      return (process.env.CARD_PAYMENT_PROVIDER || process.env.PAYMENT_PROVIDER || 'peach').toLowerCase();
    case 'BANK_TRANSFER':
    case 'INSTANT_EFT':
      return (process.env.LOCAL_BANK_PROVIDER || 'stitch').toLowerCase();
    case 'CRYPTO':
      return (process.env.CRYPTO_RAMP_PROVIDER || 'zarp').toLowerCase();
    default:
      return (process.env.PAYMENT_PROVIDER || 'stitch').toLowerCase();
  }
};

// Initialize payment with payment provider
const initiateExternalPayment = async (
  amount: number,
  currency: string,
  email: string,
  reference: string,
  provider: string = 'paystack'
) => {
  try {
    const paymentService = getPaymentService(provider);
    const result = await paymentService.initializePayment({
      amount,
      email,
      reference,
      currency
    });
    return result;
  } catch (error) {
    console.error('Payment initiation error:', error);
    return {
      success: false,
      error: 'Failed to initiate payment'
    };
  }
};

// Verify payment with payment provider
const verifyExternalPayment = async (reference: string, provider: string = 'paystack') => {
  try {
    const paymentService = getPaymentService(provider);
    const result = await paymentService.verifyPayment(reference);
    return result;
  } catch (error) {
    console.error('Payment verification error:', error);
    return {
      success: false,
      error: 'Failed to verify payment'
    };
  }
};

export const initiatePayment = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { escrowId, paymentMethod, provider } = req.body;

    // Find escrow
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
        buyer: true,
        payments: true
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    // Check if user is the buyer
    if (escrow.buyerId !== req.user!.id) {
      return res.status(403).json({ error: 'Only buyer can make payment for this escrow' });
    }

    // Check if escrow is in correct status
    if (escrow.status !== 'PENDING_PAYMENT') {
      return res.status(400).json({ error: 'Escrow is not in pending payment status' });
    }

    // Check if payment already exists
    if (escrow.payments.length > 0) {
      return res.status(400).json({ error: 'Payment already initiated for this escrow' });
    }

    // Check buyer balance for wallet payments
    if (paymentMethod === 'WALLET') {
      const balance = await prisma.walletBalance.findUnique({
        where: { userId: req.user!.id }
      });

      if (!balance || balance.amount < escrow.amount) {
        return res.status(400).json({ error: 'Insufficient wallet balance' });
      }
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        escrowId,
        userId: req.user!.id,
        amount: escrow.amount,
        currency: escrow.currency,
        method: paymentMethod as PaymentMethod,
        status: 'PENDING',
        reference: `PAY-${Date.now()}`
      }
    });

    // For wallet payments, process immediately
    if (paymentMethod === 'WALLET') {
      await processWalletPayment(escrow, payment);
      return res.json({
        payment,
        message: 'Payment processed successfully'
      });
    }

    // For external payments (Stitch, Peach, ZARP, Paystack, Flutterwave, Stripe)
    const resolvedProvider = resolvePaymentProvider(paymentMethod as PaymentMethod, provider);
    const paymentReference = payment.reference || `PAY-${payment.id}`;
    const paymentInit = await initiateExternalPayment(
      escrow.amount,
      escrow.currency,
      escrow.buyer.email,
      paymentReference,
      resolvedProvider
    );

    if (!paymentInit.success) {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });
      return res.status(400).json({ error: paymentInit.error });
    }

    // Return payment initialization details
    res.json({
      payment,
      paymentProvider: resolvedProvider,
      paymentUrl: paymentInit.data?.authorization_url || paymentInit.data?.link || paymentInit.data?.checkout_url || paymentInit.data?.interactive_url,
      redirectUrl: paymentInit.data?.redirect_url,
      clientSecret: paymentInit.data?.client_secret,
      checkoutId: paymentInit.data?.checkout_id,
      providerReference: paymentInit.data?.provider_reference,
      message: `Payment initiated with ${resolvedProvider}`
    });
  } catch (error) {
    console.error('Initiate payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

const processWalletPayment = async (escrow: any, payment: any) => {
  await prisma.$transaction(async (tx) => {
    // Deduct from buyer's wallet
    await tx.walletBalance.update({
      where: { userId: escrow.buyerId },
      data: { amount: { decrement: escrow.amount } }
    });

    // Update payment status
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: 'COMPLETED' }
    });

    // Update escrow status
    await tx.escrow.update({
      where: { id: escrow.id },
      data: { status: 'FUNDED' }
    });

    // Record transactions
    await tx.walletTransaction.create({
      data: {
        userId: escrow.buyerId,
        amount: -escrow.amount,
        transactionType: 'ESCROW_PAYMENT',
        description: `Payment for escrow: ${escrow.title}`,
        escrowId: escrow.id,
        paymentId: payment.id
      }
    });
  });
};

export const verifyPaymentCallback = async (req: Request, res: Response) => {
  try {
    const { reference, status, amount, currency, provider } = req.body;

    // Find payment by reference
    const payment = await prisma.payment.findFirst({
      where: { reference },
      include: {
        escrow: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (!payment.reference) {
      return res.status(400).json({ error: 'Payment reference is missing' });
    }

    // Verify with payment provider
    const providerName = typeof provider === 'string'
      ? provider
      : typeof req.query.provider === 'string'
        ? req.query.provider
        : process.env.PAYMENT_PROVIDER || 'stitch';
    const verification = await verifyExternalPayment(payment.reference, providerName);

    if (verification.success || isSuccessfulGatewayStatus(status)) {
      await prisma.$transaction(async (tx) => {
        // Update payment status
        await tx.payment.update({
          where: { id: payment.id },
          data: { status: 'COMPLETED' }
        });

        // Update escrow status
        await tx.escrow.update({
          where: { id: payment.escrowId },
          data: { status: 'FUNDED' }
        });

        // Record transaction for buyer
        await tx.walletTransaction.create({
          data: {
            userId: payment.escrow.buyerId,
            amount: -payment.amount,
            transactionType: 'ESCROW_PAYMENT',
            description: `Payment for escrow: ${payment.escrow.title}`,
            escrowId: payment.escrowId,
            paymentId: payment.id
          }
        });
      });

      res.json({ message: 'Payment verified and processed successfully', provider: providerName });
    } else {
      // Update payment status to failed
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });

      res.json({ message: 'Payment failed', provider: providerName, amount, currency });
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPaymentHistory = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const payments = await prisma.payment.findMany({
      where: {
        escrow: {
          OR: [
            { buyerId: req.user!.id },
            { sellerId: req.user!.id }
          ]
        }
      },
      include: {
        escrow: {
          select: {
            id: true,
            title: true,
            status: true,
            buyer: { select: { id: true, name: true } },
            seller: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    });

    const total = await prisma.payment.count({
      where: {
        escrow: {
          OR: [
            { buyerId: req.user!.id },
            { sellerId: req.user!.id }
          ]
        }
      }
    });

    res.json({
      payments,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get payment history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const refundPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { paymentId, reason } = req.body;

    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        escrow: true
      }
    });

    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    // Check if user is involved in the escrow
    if (payment.escrow.buyerId !== req.user!.id && payment.escrow.sellerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to refund this payment' });
    }

    // Check if payment can be refunded
    if (payment.status !== 'COMPLETED') {
      return res.status(400).json({ error: 'Payment cannot be refunded' });
    }

    // Process refund
    await prisma.$transaction(async (tx) => {
      // Update payment status
      await tx.payment.update({
        where: { id: paymentId },
        data: { status: 'REFUNDED' }
      });

      // Refund to buyer's wallet
      await tx.walletBalance.upsert({
        where: { userId: payment.escrow.buyerId },
        update: { amount: { increment: payment.amount } },
        create: { userId: payment.escrow.buyerId, amount: payment.amount }
      });

      // Record refund transaction
      await tx.walletTransaction.create({
        data: {
          userId: payment.escrow.buyerId,
          amount: payment.amount,
          transactionType: 'REFUND',
          description: `Refund for escrow: ${payment.escrow.title} - ${reason}`,
          escrowId: payment.escrowId,
          paymentId
        }
      });
    });

    res.json({ message: 'Payment refunded successfully' });
  } catch (error) {
    console.error('Refund payment error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};