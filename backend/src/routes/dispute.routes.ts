import { Router } from 'express';
import { body } from 'express-validator';
import {
  createDispute,
  getDisputes,
  getDisputeById,
  addDisputeMessage,
  resolveDispute,
  getAdminDisputesQueue
} from '../controllers/dispute.controller';
import { authenticate, requireRole } from '../middleware/auth.middleware';

const router = Router();

// All dispute routes require authentication
router.use(authenticate);

// Create new dispute
router.post('/', [
  body('escrowId').notEmpty().isString().withMessage('Valid escrow ID required'),
  body('reason').isIn(['ITEM_NOT_RECEIVED', 'ITEM_NOT_AS_DESCRIBED', 'QUALITY_ISSUES', 'LATE_DELIVERY', 'OTHER'])
    .withMessage('Invalid dispute reason'),
  body('description').notEmpty().withMessage('Description is required'),
  body('evidence').isArray({ min: 1 })
    .withMessage('Evidence is required (upload at least one photo/video link)')
], createDispute);

// Get user's disputes
router.get('/', getDisputes);

// Admin weighted queue (senior-staff triage)
// NOTE: must be declared before "/:id" so "admin" isn't parsed as an id
router.get('/admin/queue', [
  requireRole(['ADMIN']),
], getAdminDisputesQueue);

// Get specific dispute
router.get('/:id', getDisputeById);

// Add message to dispute
router.post('/:disputeId/messages', [
  body('message').notEmpty().withMessage('Message is required'),
  body('messageType').optional().isIn(['TEXT', 'IMAGE', 'FILE']),
  body('attachments').optional().isArray()
], addDisputeMessage);

// Resolve dispute (admin only - should be restricted)
router.post('/:disputeId/resolve', [
  requireRole(['ADMIN']),
  body('resolution').isIn(['REFUND_BUYER', 'PAY_SELLER', 'SPLIT'])
    .withMessage('Invalid resolution'),
  body('winnerId').optional().isString(),
  body('refundAmount').optional().isFloat({ min: 0 }),
  body('notes').optional().isString()
], resolveDispute);

export default router;
