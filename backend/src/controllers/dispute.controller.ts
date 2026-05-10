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

    if (!Array.isArray(normalizedEvidence) || normalizedEvidence.length < 1) {
      return res.status(422).json({
        error: 'Evidence is required to open a dispute',
      });
    }

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

    // Check if escrow can be disputed (PRD: dispute window begins after delivery)
    const disputableStatuses: EscrowStatus[] = ['DELIVERED'];
    if (!disputableStatuses.includes(escrow.status)) {
      return res.status(400).json({ error: 'Escrow can only be disputed after delivery' });
    }

    const deliveredAt = (escrow as any).deliveredAt as Date | string | null | undefined;

    if (!deliveredAt) {
      return res.status(422).json({ error: 'deliveredAt is required to open a dispute' });
    }

    const deliveredAtMs = new Date(deliveredAt).getTime();
    const graceDeadlineMs = deliveredAtMs + 24 * 60 * 60 * 1000;

    if (Date.now() > graceDeadlineMs) {
      return res.status(403).json({
        error: 'Dispute window has expired (24 hours after delivery)',
      });
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

    // Check if user is involved in the escrow (or admin)
    const isInvolved =
      dispute.escrow.buyerId === req.user!.id || dispute.escrow.sellerId === req.user!.id;

    if (!isInvolved && req.user!.role !== 'ADMIN') {
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

    // Controller-level guard (route middleware already restricts, but keep it safe)
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin only' });
    }

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

export const getAdminDisputesQueue = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin only' });
    }

    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const disputes = await prisma.dispute.findMany({
      where: {
        status: {
          in: ['OPEN', 'UNDER_REVIEW'],
        },
      },
      include: {
        initiator: {
          select: {
            id: true,
            name: true,
            email: true,
            completedTransactions: true,
            rating: true,
          },
        },
        escrow: {
          select: {
            id: true,
            title: true,
            amount: true,
            currency: true,
            status: true,
            buyerId: true,
            sellerId: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // MVP Weighted Queue:
    // - High value (>= R10,000) first
    // - Within bucket: FIFO (oldest first)
    // - Risk is a placeholder heuristic (used for UI badges)
    const scored = disputes.map((d) => {
      const highValue = d.escrow.amount >= 10000;

      const ageMs = Date.now() - d.createdAt.getTime();
      const risk =
        d.initiator.completedTransactions < 5 || d.initiator.rating < 2.5
          ? 'MODERATE_RISK'
          : 'LOW_RISK';

      return {
        disputeId: d.id,
        escrowId: d.escrowId,
        status: d.status,
        createdAt: d.createdAt,
        ageMs,
        highValue,
        risk,
        escrow: {
          id: d.escrow.id,
          title: d.escrow.title,
          amount: d.escrow.amount,
          currency: d.escrow.currency,
          status: d.escrow.status,
        },
        initiator: {
          id: d.initiator.id,
          name: d.initiator.name,
          email: d.initiator.email,
          completedTransactions: d.initiator.completedTransactions,
          rating: d.initiator.rating,
        },
        evidenceUrls: d.evidenceUrls,
      };
    });

    scored.sort((a, b) => {
      const ah = a.highValue ? 0 : 1;
      const bh = b.highValue ? 0 : 1;
      if (ah !== bh) return ah - bh;
      return a.createdAt.getTime() - b.createdAt.getTime();
    });

    const total = scored.length;
    const items = scored.slice(offset, offset + Number(limit));

    return res.json({
      items,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get admin disputes queue error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};
