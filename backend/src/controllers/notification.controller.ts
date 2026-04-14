import { Request, Response } from 'express';
import { PrismaClient, NotificationType } from '@prisma/client';
import { AuthRequest } from '../middleware/auth.middleware';

const prisma = new PrismaClient();

export const getNotifications = async (req: AuthRequest, res: Response) => {
  try {
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const where = {
      userId: req.user!.id,
      ...(unreadOnly === 'true' && { isRead: false })
    };

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: offset,
      take: Number(limit)
    });

    const total = await prisma.notification.count({ where });

    res.json({
      notifications,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markNotificationAsRead = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to mark this notification' });
    }

    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ message: 'Notification marked as read' });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const markAllNotificationsAsRead = async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: {
        userId: req.user!.id,
        isRead: false
      },
      data: { isRead: true }
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUnreadNotificationCount = async (req: AuthRequest, res: Response) => {
  try {
    const unreadCount = await prisma.notification.count({
      where: {
        userId: req.user!.id,
        isRead: false
      }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Get unread notification count error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteNotification = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized to delete this notification' });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper function to create notifications (used by other controllers)
export const createNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: any
) => {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {}
      }
    });
  } catch (error) {
    console.error('Create notification error:', error);
  }
};

// Specific notification creators
export const notifyEscrowCreated = async (buyerId: string, sellerId: string, escrowTitle: string) => {
  await Promise.all([
    createNotification(
      buyerId,
      'ESCROW_CREATED',
      'Escrow Created',
      `You created an escrow for "${escrowTitle}"`,
      { escrowTitle }
    ),
    createNotification(
      sellerId,
      'ESCROW_CREATED',
      'New Escrow',
      `You have a new escrow: "${escrowTitle}"`,
      { escrowTitle }
    )
  ]);
};

export const notifyEscrowFunded = async (sellerId: string, escrowTitle: string) => {
  await createNotification(
    sellerId,
    'ESCROW_FUNDED',
    'Escrow Funded',
    `Your escrow "${escrowTitle}" has been funded`,
    { escrowTitle }
  );
};

export const notifyEscrowDelivered = async (buyerId: string, escrowTitle: string) => {
  await createNotification(
    buyerId,
    'ESCROW_DELIVERED',
    'Item Delivered',
    `The seller has marked "${escrowTitle}" as delivered`,
    { escrowTitle }
  );
};

export const notifyEscrowCompleted = async (sellerId: string, escrowTitle: string, amount: number) => {
  await createNotification(
    sellerId,
    'ESCROW_COMPLETED',
    'Escrow Completed',
    `Funds released for "${escrowTitle}" - R${amount} credited to your wallet`,
    { escrowTitle, amount }
  );
};

export const notifyDisputeCreated = async (userId: string, escrowTitle: string) => {
  await createNotification(
    userId,
    'DISPUTE_CREATED',
    'Dispute Opened',
    `A dispute has been opened for "${escrowTitle}"`,
    { escrowTitle }
  );
};

export const notifyDisputeResolved = async (userId: string, escrowTitle: string, resolution: string) => {
  await createNotification(
    userId,
    'DISPUTE_RESOLVED',
    'Dispute Resolved',
    `Dispute for "${escrowTitle}" has been resolved: ${resolution}`,
    { escrowTitle, resolution }
  );
};

export const notifyNewMessage = async (userId: string, senderName: string, escrowTitle: string) => {
  await createNotification(
    userId,
    'NEW_MESSAGE',
    'New Message',
    `${senderName} sent you a message regarding "${escrowTitle}"`,
    { senderName, escrowTitle }
  );
};