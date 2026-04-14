import { Request, Response } from 'express';
import { PrismaClient, DisputeStatus, EscrowStatus, MessageType } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const createDispute = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { escrowId, reason, description, evidence, evidenceUrls } = req.body;
    const normalizedEvidence = evidenceUrls || evidence || [];

    // Find escrow
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      include: {
        buyer: true,
        seller: true,
        dispute: true
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    // Check if user is involved in this escrow
    if (escrow.buyerId !== req.user!.id && escrow.sellerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to create dispute for this escrow' });
    }

    // Check if escrow can be disputed
    const disputableStatuses = ['FUNDED', 'IN_DELIVERY', 'DELIVERED'];
    if (!disputableStatuses.includes(escrow.status)) {
      return res.status(400).json({ error: 'Escrow cannot be disputed at this stage' });
    }

    // Check if dispute already exists
    if (escrow.dispute) {
      return res.status(400).json({ error: 'Dispute already exists for this escrow' });
    }

    // Create dispute
    const dispute = await prisma.dispute.create({
      data: {
        escrowId,
        initiatorId: req.user!.id,
        reason,
        description,
        evidenceUrls: normalizedEvidence,
        status: 'OPEN'
      },
      include: {
        initiator: {
          select: { id: true, name: true, email: true }
        },
        escrow: {
          select: {
            id: true,
            title: true,
            status: true,
            buyer: { select: { id: true, name: true } },
            seller: { select: { id: true, name: true } }
          }
        }
      }
    });

    // Update escrow status to DISPUTED
    await prisma.escrow.update({
      where: { id: escrowId },
      data: { status: 'DISPUTED' }
    });

    // Create initial dispute message
    await prisma.disputeMessage.create({
      data: {
        disputeId: dispute.id,
        senderId: req.user!.id,
        message: description,
        messageType: 'TEXT'
      }
    });

    res.status(201).json({
      dispute,
      message: 'Dispute created successfully'
    });
  } catch (error) {
    console.error('Create dispute error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDisputes = async (req: AuthRequest, res: Response) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = {
      escrow: {
        OR: [
          { buyerId: req.user!.id },
          { sellerId: req.user!.id }
        ]
      },
      ...(status && { status: status as DisputeStatus })
    };

    const disputes = await prisma.dispute.findMany({
      where,
      include: {
        initiator: {
          select: { id: true, name: true, email: true }
        },
        escrow: {
          select: {
            id: true,
            title: true,
            status: true,
            amount: true,
            currency: true,
            buyer: { select: { id: true, name: true } },
            seller: { select: { id: true, name: true } }
          }
        },
        messages: {
          include: {
            sender: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    });

    const total = await prisma.dispute.count({ where });

    res.json({
      disputes,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get disputes error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getDisputeById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const dispute = await prisma.dispute.findUnique({
      where: { id },
      include: {
        initiator: {
          select: { id: true, name: true, email: true }
        },
        escrow: {
          select: {
            id: true,
            title: true,
            status: true,
            amount: true,
            currency: true,
            buyerId: true,
            sellerId: true,
            buyer: { select: { id: true, name: true, email: true } },
            seller: { select: { id: true, name: true, email: true } }
          }
        },
        messages: {
          include: {
            sender: { select: { id: true, name: true } }
          },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    // Check if user is involved in the escrow
    if (dispute.escrow.buyerId !== req.user!.id && dispute.escrow.sellerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to view this dispute' });
    }

    res.json({ dispute });
  } catch (error) {
    console.error('Get dispute by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const addDisputeMessage = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { disputeId } = req.params;
    const { message, messageType = 'TEXT', attachments } = req.body;

    // Find dispute
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        escrow: true
      }
    });

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    // Check if user is involved in the escrow
    if (dispute.escrow.buyerId !== req.user!.id && dispute.escrow.sellerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to participate in this dispute' });
    }

    // Check if dispute is still open
    if (dispute.status !== 'OPEN') {
      return res.status(400).json({ error: 'Dispute is not open for new messages' });
    }

    // Add message
    const disputeMessage = await prisma.disputeMessage.create({
      data: {
        disputeId,
        senderId: req.user!.id,
        message,
        messageType: messageType as MessageType,
        attachments: attachments || []
      },
      include: {
        sender: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({
      disputeMessage,
      message: 'Message added to dispute successfully'
    });
  } catch (error) {
    console.error('Add dispute message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const resolveDispute = async (req: AuthRequest, res: Response) => {
  try {
    const { disputeId } = req.params;
    const { resolution, winnerId, refundAmount, notes } = req.body;

    // Only admin can resolve disputes - in a real app, check for admin role
    // For now, allow any user to resolve (this should be restricted)
    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: {
        escrow: {
          include: {
            buyer: true,
            seller: true
          }
        }
      }
    });

    if (!dispute) {
      return res.status(404).json({ error: 'Dispute not found' });
    }

    if (dispute.status !== 'OPEN') {
      return res.status(400).json({ error: 'Dispute is not open' });
    }

    await prisma.$transaction(async (tx) => {
      // Update dispute status and resolution fields
      await tx.dispute.update({
        where: { id: disputeId },
        data: {
          status: 'RESOLVED',
          resolvedAt: new Date(),
          resolution,
          resolutionAmount: refundAmount || undefined
        }
      });

      // Update escrow status based on outcome
      const escrowStatus = resolution === 'REFUND_BUYER' ? 'REFUNDED'
        : resolution === 'PAY_SELLER' ? 'COMPLETED'
        : 'COMPLETED';

      await tx.escrow.update({
        where: { id: dispute.escrowId },
        data: { status: escrowStatus }
      });

      // Handle fund distribution based on resolution
      if (resolution === 'REFUND_BUYER') {
        await tx.walletBalance.upsert({
          where: { userId: dispute.escrow.buyerId },
          update: { amount: { increment: dispute.escrow.amount } },
          create: { userId: dispute.escrow.buyerId, amount: dispute.escrow.amount }
        });

        await tx.walletTransaction.create({
          data: {
            userId: dispute.escrow.buyerId,
            amount: dispute.escrow.amount,
            transactionType: 'CREDIT',
            description: `Dispute resolution refund - ${dispute.escrow.title}`,
            escrowId: dispute.escrowId
          }
        });
      } else if (resolution === 'PAY_SELLER') {
        await tx.walletBalance.upsert({
          where: { userId: dispute.escrow.sellerId },
          update: { amount: { increment: dispute.escrow.amount } },
          create: { userId: dispute.escrow.sellerId, amount: dispute.escrow.amount }
        });

        await tx.walletTransaction.create({
          data: {
            userId: dispute.escrow.sellerId,
            amount: dispute.escrow.amount,
            transactionType: 'CREDIT',
            description: `Dispute resolution payment - ${dispute.escrow.title}`,
            escrowId: dispute.escrowId
          }
        });
      } else if (resolution === 'SPLIT' && refundAmount) {
        const sellerAmount = dispute.escrow.amount - refundAmount;

        if (refundAmount > 0) {
          await tx.walletBalance.upsert({
            where: { userId: dispute.escrow.buyerId },
            update: { amount: { increment: refundAmount } },
            create: { userId: dispute.escrow.buyerId, amount: refundAmount }
          });

          await tx.walletTransaction.create({
            data: {
              userId: dispute.escrow.buyerId,
              amount: refundAmount,
              transactionType: 'CREDIT',
              description: `Dispute resolution partial refund - ${dispute.escrow.title}`,
              escrowId: dispute.escrowId
            }
          });
        }

        if (sellerAmount > 0) {
          await tx.walletBalance.upsert({
            where: { userId: dispute.escrow.sellerId },
            update: { amount: { increment: sellerAmount } },
            create: { userId: dispute.escrow.sellerId, amount: sellerAmount }
          });

          await tx.walletTransaction.create({
            data: {
              userId: dispute.escrow.sellerId,
              amount: sellerAmount,
              transactionType: 'CREDIT',
              description: `Dispute resolution partial payment - ${dispute.escrow.title}`,
              escrowId: dispute.escrowId
            }
          });
        }
      }
    });

    res.json({ message: 'Dispute resolved successfully' });
  } catch (error) {
    console.error('Resolve dispute error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};