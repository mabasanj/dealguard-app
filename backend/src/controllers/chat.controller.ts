import { Request, Response } from 'express';
import { PrismaClient, MessageType } from '@prisma/client';
import { validationResult } from 'express-validator';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getChatMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { escrowId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // Verify user is part of this escrow
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.buyerId !== req.user!.id && escrow.sellerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to view chat messages' });
    }

    const messages = await prisma.chatMessage.findMany({
      where: { escrowId },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      },
      orderBy: { createdAt: 'asc' },
      skip: offset,
      take: Number(limit)
    });

    const total = await prisma.chatMessage.count({
      where: { escrowId }
    });

    res.json({
      messages,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get chat messages error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { escrowId } = req.params;
    const { message, messageType = 'TEXT', attachments } = req.body;

    // Verify user is part of this escrow
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true,
        status: true
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.buyerId !== req.user!.id && escrow.sellerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to send messages in this chat' });
    }

    // Create message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        escrowId,
        senderId: req.user!.id,
        receiverId: escrow.buyerId === req.user!.id ? escrow.sellerId : escrow.buyerId,
        message,
        messageType: messageType as MessageType,
        attachments: attachments || []
      },
      include: {
        sender: {
          select: { id: true, name: true, image: true }
        }
      }
    });

    res.status(201).json({
      chatMessage,
      message: 'Message sent successfully'
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markMessagesAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { escrowId } = req.params;

    // Verify user is part of this escrow
    const escrow = await prisma.escrow.findUnique({
      where: { id: escrowId },
      select: {
        id: true,
        buyerId: true,
        sellerId: true
      }
    });

    if (!escrow) {
      return res.status(404).json({ error: 'Escrow not found' });
    }

    if (escrow.buyerId !== req.user!.id && escrow.sellerId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to mark messages as read' });
    }

    // Mark messages as read (excluding user's own messages)
    await prisma.chatMessage.updateMany({
      where: {
        escrowId,
        senderId: { not: req.user!.id },
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUnreadMessageCount = async (req: AuthRequest, res: Response) => {
  try {
    // Get all escrows where user is buyer or seller
    const escrows = await prisma.escrow.findMany({
      where: {
        OR: [
          { buyerId: req.user!.id },
          { sellerId: req.user!.id }
        ]
      },
      select: { id: true }
    });

    const escrowIds = escrows.map(e => e.id);

    // Count unread messages across all user's escrows
    const unreadCount = await prisma.chatMessage.count({
      where: {
        escrowId: { in: escrowIds },
        senderId: { not: req.user!.id },
        isRead: false
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread message count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getChatRooms = async (req: AuthRequest, res: Response) => {
  try {
    const escrows = await prisma.escrow.findMany({
      where: {
        OR: [
          { buyerId: req.user!.id },
          { sellerId: req.user!.id }
        ]
      },
      include: {
        buyer: {
          select: { id: true, name: true, image: true }
        },
        seller: {
          select: { id: true, name: true, image: true }
        },
        chatMessages: {
          where: { senderId: { not: req.user!.id } },
          select: { isRead: true, message: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    const chatRooms = escrows.map(escrow => {
      const otherUser = escrow.buyerId === req.user!.id ? escrow.seller : escrow.buyer;
      const lastMessage = escrow.chatMessages[0];
      const unreadCount = escrow.chatMessages.filter(msg => !msg.isRead).length;

      return {
        escrowId: escrow.id,
        title: escrow.title,
        status: escrow.status,
        otherUser,
        lastMessage: lastMessage ? {
          message: lastMessage.message,
          createdAt: lastMessage.createdAt,
          isRead: lastMessage.isRead
        } : null,
        unreadCount
      };
    });

    res.json({ chatRooms });
  } catch (error) {
    console.error('Get chat rooms error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};