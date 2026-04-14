import { Router } from 'express';
import { body } from 'express-validator';
import {
  getChatMessages,
  sendMessage,
  markMessagesAsRead,
  getUnreadMessageCount,
  getChatRooms
} from '../controllers/chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All chat routes require authentication
router.use(authenticate);

// Get chat messages for an escrow
router.get('/:escrowId/messages', getChatMessages);

// Send message in escrow chat
router.post('/:escrowId/messages', [
  body('message').notEmpty().withMessage('Message is required'),
  body('messageType').optional().isIn(['TEXT', 'IMAGE', 'FILE', 'SYSTEM']),
  body('attachments').optional().isArray()
], sendMessage);

// Mark messages as read
router.patch('/:escrowId/read', markMessagesAsRead);

// Get unread message count
router.get('/unread/count', getUnreadMessageCount);

// Get all chat rooms for user
router.get('/', getChatRooms);

export default router;