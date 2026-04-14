import { Router } from 'express';
import { body } from 'express-validator';
import {
  initiatePayment,
  verifyPaymentCallback,
  getPaymentHistory,
  refundPayment
} from '../controllers/payment.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All payment routes require authentication except webhook
router.use(authenticate);

// Initiate payment for escrow
router.post('/initiate', [
  body('escrowId').notEmpty().isString().withMessage('Valid escrow ID required'),
  body('paymentMethod').isIn(['CARD', 'BANK_TRANSFER', 'MOBILE_MONEY', 'WALLET'])
    .withMessage('Invalid payment method')
], initiatePayment);

// Get payment history
router.get('/history', getPaymentHistory);

// Refund payment (admin only - should be restricted)
router.post('/refund', [
  body('paymentId').notEmpty().isString().withMessage('Valid payment ID required'),
  body('reason').notEmpty().withMessage('Refund reason required')
], refundPayment);

// Payment verification callback (webhook - no auth required)
router.post('/verify', verifyPaymentCallback);

export default router;