import { Router } from 'express';
import { body } from 'express-validator';
import {
  createEscrow,
  getEscrows,
  getEscrowById,
  updateEscrowStatus,
  releaseFunds
} from '../controllers/escrow.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All escrow routes require authentication
router.use(authenticate);

// Create new escrow
router.post('/', [
  body('title').notEmpty().withMessage('Title is required'),
  body('description').notEmpty().withMessage('Description is required'),
  body('amount').isFloat({ min: 0 }).withMessage('Amount must be a positive number'),
  body('currency').isIn(['ZAR', 'USD', 'EUR', 'GBP', 'KES', 'TZS', 'BWP', 'ZMW', 'SZL', 'LSL'])
    .withMessage('Invalid currency'),
  body('buyerId').optional().isString().withMessage('buyerId must be a string'),
  body('sellerId').optional().isString().withMessage('sellerId must be a string'),
  body('sellerEmail').optional().isEmail().withMessage('sellerEmail must be a valid email'),
  body('category').optional().isString(),
  body('deliveryTime').optional().isInt({ min: 1 }),
  body('terms').optional().isString(),
  body('autoRelease').optional().isBoolean(),
  body('inspectionPeriod').optional().isInt({ min: 1, max: 30 })
], createEscrow);

// Get user's escrows
router.get('/', getEscrows);

// Get specific escrow
router.get('/:id', getEscrowById);

// Update escrow status
router.patch('/:id/status', [
  body('status').isIn([
    'PENDING_PAYMENT',
    'FUNDED',
    'IN_DELIVERY',
    'DELIVERED',
    'COMPLETED',
    'CANCELLED',
    'DISPUTED',
    'RESOLVED',
    'REFUNDED'
  ])
    .withMessage('Invalid status'),
  body('notes').optional().isString()
], updateEscrowStatus);

// Release funds (buyer action)
router.post('/:id/release', releaseFunds);

export default router;