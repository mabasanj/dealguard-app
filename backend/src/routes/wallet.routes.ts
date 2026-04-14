import { Router } from 'express';
import { body } from 'express-validator';
import {
  getWalletBalance,
  getWalletTransactions,
  addFunds,
  withdrawFunds,
  transferFunds
} from '../controllers/wallet.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All wallet routes require authentication
router.use(authenticate);

// Get wallet balance
router.get('/balance', getWalletBalance);

// Get wallet transactions
router.get('/transactions', getWalletTransactions);

// Add funds to wallet
router.post('/add-funds', [
  body('amount').isFloat({ min: 10 }).withMessage('Minimum amount is R10'),
  body('paymentMethod').isIn(['CARD', 'BANK_TRANSFER', 'MOBILE_MONEY'])
    .withMessage('Invalid payment method'),
  body('reference').optional().isString()
], addFunds);

// Withdraw funds from wallet
router.post('/withdraw', [
  body('amount').isFloat({ min: 100 }).withMessage('Minimum withdrawal is R100'),
  body('bankAccount').notEmpty().withMessage('Bank account details required'),
  body('paymentMethod').isIn(['BANK_TRANSFER']).withMessage('Invalid withdrawal method')
], withdrawFunds);

// Transfer funds to another user
router.post('/transfer', [
  body('recipientEmail').isEmail().withMessage('Valid recipient email required'),
  body('amount').isFloat({ min: 1 }).withMessage('Amount must be positive'),
  body('description').optional().isString().isLength({ max: 255 })
], transferFunds);

export default router;