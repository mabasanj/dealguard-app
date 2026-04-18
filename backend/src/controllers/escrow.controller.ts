import { Request, Response } from 'express';
import { PrismaClient, EscrowStatus } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.middleware';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();
const TRANSACTION_FEE_RATE = 0.07;

export const createEscrow = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      title,
      description,
      amount,
      currency = 'ZAR',
      buyerId,
      sellerId,
      sellerEmail,
      itemsCount = 1,
      terms,
      location,
      deliveryAddress
    } = req.body;

    const effectiveBuyerId = buyerId || req.user!.id;

    let effectiveSellerId = sellerId as string | undefined;
    if (!effectiveSellerId && sellerEmail) {
      const sellerByEmail = await prisma.user.findUnique({
        where: { email: sellerEmail },
        select: { id: true }
      });
      if (!sellerByEmail) {
        return res.status(400).json({ error: 'Seller not found for provided email' });
      }
      effectiveSellerId = sellerByEmail.id;
    }

    if (!effectiveSellerId) {
      return res.status(400).json({ error: 'sellerId or sellerEmail is required' });
    }

    // Validate that the current user is either buyer or seller
    if (req.user!.id !== effectiveBuyerId && req.user!.id !== effectiveSellerId) {
      return res.status(403).json({ error: 'Unauthorized to create this escrow' });
    }

    // Platform fee is fixed at 7% of transaction amount only (other charges are excluded).
    const numericAmount = Number(amount);
    const platformFee = Number((numericAmount * TRANSACTION_FEE_RATE).toFixed(2));
    const sellerReceives = Number((numericAmount - platformFee).toFixed(2));
    const reference = `ESC-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create escrow transaction
    const escrow = await prisma.escrow.create({
      data: {
        title,
        description,
        amount,
        currency,
        platformFee,
        sellerReceives,
        buyerId: effectiveBuyerId,
        sellerId: effectiveSellerId,
        itemsCount,
        terms,
        location,
        deliveryAddress,
        reference,
        status: 'PENDING' as EscrowStatus
      },
      include: {
        buyer: {
          select: { id: true, name: true, email: true }
        },
        seller: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    res.status(201).json({
      escrow,
      message: 'Escrow created successfully'
    });
  } catch (error) {
    console.error('Create escrow error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEscrows = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = {
      OR: [
        { buyerId: req.user!.id },
        { sellerId: req.user!.id }
      ],
      ...(status && { status: status as EscrowStatus })
    };

    const escrows = await prisma.escrow.findMany({
      where,
      include: {
        buyer: {
          select: { id: true, name: true, email: true }
        },
        seller: {
          select: { id: true, name: true, email: true }
        },
        payments: {
          select: {
            id: true,
            amount: true,
            status: true,
            method: true,
            createdAt: true
          }
        },
        dispute: {
          select: {
            id: true,
            reason: true,
            status: true,
            createdAt: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    });

    const total = await prisma.escrow.count({ where });

    res.json({
      escrows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get escrows error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEscrowById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const escrow = await prisma.escrow.findUnique({
      where: { id },
      include: {
        buyer: {
          select: { id: true, name: true, email: true, phone: true }
        },
        seller: {
          select: { id: true, name: true, email: true, phone: true }
        },
        payments: true,
        dispute: {
          include: {
            messages: {
              include: {
                sender: { select: { id: true, name: true } }
              },
              orderBy: { createdAt: 'asc' }
            }
          }
        },
        chatMessages: {
          include: {
            sender: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    // Check if user is involved in this escrow
    if (escrow.buyerId !== req.user!.id && escrow.sellerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to view this escrow' });
    }

    res.json({ escrow });
  } catch (error) {
    console.error('Get escrow by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEscrowStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    const escrow = await prisma.escrow.findUnique({
      where: { id },
      include: {
        buyer: true,
        seller: true
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    // Check permissions based on status change
    const isBuyer = escrow.buyerId === req.user!.id;
    const isSeller = escrow.sellerId === req.user!.id;

    if (!isBuyer && !isSeller) {
      return res.status(403).json({ error: 'Unauthorized to update this escrow' });
    }

    // Validate status transitions
    const validTransitions: Record<EscrowStatus, string[]> = {
      [EscrowStatus.PENDING]: ['PENDING_PAYMENT', 'CANCELLED'],
      [EscrowStatus.PENDING_PAYMENT]: ['FUNDED', 'CANCELLED'],
      [EscrowStatus.FUNDED]: ['IN_DELIVERY', 'DISPUTED', 'CANCELLED'],
      [EscrowStatus.IN_DELIVERY]: ['DELIVERED', 'DISPUTED', 'CANCELLED'],
      [EscrowStatus.DELIVERED]: ['COMPLETED', 'DISPUTED', 'REFUNDED'],
      [EscrowStatus.DISPUTED]: ['RESOLVED', 'CANCELLED', 'REFUNDED'],
      [EscrowStatus.RESOLVED]: ['COMPLETED', 'REFUNDED'],
      [EscrowStatus.COMPLETED]: [],
      [EscrowStatus.CANCELLED]: [],
      [EscrowStatus.REFUNDED]: []
    };

    if (!validTransitions[escrow.status].includes(status)) {
      return res.status(400).json({ error: 'Invalid status transition' });
    }

    // Additional validation for specific transitions
    if (status === 'COMPLETED' && !isBuyer) {
      return res.status(403).json({ error: 'Only buyer can mark escrow as completed' });
    }

    if (status === 'DELIVERED' && !isSeller) {
      return res.status(403).json({ error: 'Only seller can mark as delivered' });
    }

    // Update escrow status
    const updatedEscrow = await prisma.escrow.update({
      where: { id },
      data: {
        status: status as EscrowStatus,
        ...(status === 'COMPLETED' && { completedAt: new Date() }),
        ...(status === 'CANCELLED' && { cancelledAt: new Date() })
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } }
      }
    });

    // Handle wallet transfers for completion
    if (status === 'COMPLETED') {
      // Transfer funds to seller
      await prisma.$transaction(async (tx) => {
        // Deduct from escrow (already in escrow account)
        // Add to seller's wallet
        await tx.walletBalance.upsert({
          where: { userId: escrow.sellerId },
          update: { amount: { increment: escrow.amount } },
          create: { userId: escrow.sellerId, amount: escrow.amount }
        });

        // Record transaction
        await tx.walletTransaction.create({
          data: {
            userId: escrow.sellerId,
            amount: escrow.amount,
            transactionType: 'CREDIT',
            description: `Escrow completion - ${escrow.title}`,
            escrowId: escrow.id
          }
        });
      });
    }

    // Handle refunds for cancellation
    if (status === 'CANCELLED' || status === 'REFUNDED') {
      await prisma.$transaction(async (tx) => {
        // Refund to buyer
        await tx.walletBalance.upsert({
          where: { userId: escrow.buyerId },
          update: { amount: { increment: escrow.amount } },
          create: { userId: escrow.buyerId, amount: escrow.amount }
        });

        // Record transaction
        await tx.walletTransaction.create({
          data: {
            userId: escrow.buyerId,
            amount: escrow.amount,
            transactionType: 'CREDIT',
            description: `Escrow refund - ${escrow.title}`,
            escrowId: escrow.id
          }
        });
      });
    }

    res.json({
      escrow: updatedEscrow,
      message: 'Escrow status updated successfully'
    });
  } catch (error) {
    console.error('Update escrow status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const releaseFunds = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const escrow = await prisma.escrow.findUnique({
      where: { id },
      include: {
        buyer: true,
        seller: true
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    // Only buyer can release funds
    if (escrow.buyerId !== req.user!.id) {
      return res.status(403).json({ error: 'Only buyer can release funds' });
    }

    if (escrow.status !== 'DELIVERED') {
      return res.status(400).json({ error: 'Escrow must be in DELIVERED status to release funds' });
    }

    // Update status to COMPLETED
    const updatedEscrow = await prisma.escrow.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      },
      include: {
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } }
      }
    });

    // Transfer funds to seller
    await prisma.$transaction(async (tx) => {
      await tx.walletBalance.upsert({
        where: { userId: escrow.sellerId },
        update: { amount: { increment: escrow.amount } },
        create: { userId: escrow.sellerId, amount: escrow.amount }
      });

      await tx.walletTransaction.create({
        data: {
          userId: escrow.sellerId,
          amount: escrow.amount,
          transactionType: 'CREDIT',
          description: `Funds released - ${escrow.title}`,
          escrowId: escrow.id
        }
      });
    });

    res.json({
      escrow: updatedEscrow,
      message: 'Funds released successfully'
    });
  } catch (error) {
    console.error('Release funds error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};