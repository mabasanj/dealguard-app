import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import {
  createZarpDepositSessionController,
  createZarpWithdrawSessionController,
  getSorobanNetworkController,
  releaseFundsController,
  setupEscrowController,
  submitSignedXdrController,
  sep24AuthController,
  sep24DepositController,
  sep24WithdrawController,
  sep24TransactionStatusController,
  zarpInfoController,
  zarpAccountBalancesController,
  zarpAddTrustlineController,
  zarpSendPaymentController,
} from '../controllers/stellar.controller';

const router = Router();

router.use(authenticate);

router.get('/network', getSorobanNetworkController);

router.post(
  '/bridge/zarp/deposit',
  [
    body('account').notEmpty().isString().withMessage('account is required'),
    body('amount').optional().isString(),
    body('memo').optional().isString(),
    body('memoType').optional().isString(),
    body('callbackUrl').optional().isString(),
    body('emailAddress').optional().isEmail().withMessage('emailAddress must be valid')
  ],
  createZarpDepositSessionController
);

router.post(
  '/bridge/zarp/withdraw',
  [
    body('account').notEmpty().isString().withMessage('account is required'),
    body('amount').optional().isString(),
    body('memo').optional().isString(),
    body('memoType').optional().isString(),
    body('callbackUrl').optional().isString(),
    body('emailAddress').optional().isEmail().withMessage('emailAddress must be valid')
  ],
  createZarpWithdrawSessionController
);

router.post(
  '/setup-escrow',
  [
    body('escrowSecret').notEmpty().isString().withMessage('escrowSecret is required'),
    body('buyerPubKey').notEmpty().isString().withMessage('buyerPubKey is required'),
    body('sellerPubKey').notEmpty().isString().withMessage('sellerPubKey is required'),
    body('appPubKey').optional().isString().withMessage('appPubKey must be a string'),
  ],
  setupEscrowController
);

router.post(
  '/release-funds-xdr',
  [
    body('escrowPubKey').notEmpty().isString().withMessage('escrowPubKey is required'),
    body('sellerPubKey').notEmpty().isString().withMessage('sellerPubKey is required'),
    body('appSecretKey').optional().isString().withMessage('appSecretKey must be a string'),
    body('amount').optional().isString().withMessage('amount must be a string decimal value'),
    body('assetCode').optional().isString(),
    body('assetIssuer').optional().isString(),
  ],
  releaseFundsController
);

router.post(
  '/submit-signed-xdr',
  [
    body('xdr').notEmpty().isString().withMessage('xdr is required'),
  ],
  submitSignedXdrController
);

// ─── SEP-24 Routes ────────────────────────────────────────────────────────────

router.post(
  '/sep24/auth',
  [
    body('account').notEmpty().isString().withMessage('account (Stellar public key) is required'),
    body('signingSecretKey').optional().isString(),
  ],
  sep24AuthController
);

router.post(
  '/sep24/deposit',
  [
    body('jwt').notEmpty().isString().withMessage('jwt is required'),
    body('account').notEmpty().isString().withMessage('account is required'),
    body('amount').optional().isString(),
    body('assetCode').optional().isString(),
    body('memo').optional().isString(),
    body('memoType').optional().isString(),
    body('emailAddress').optional().isEmail(),
  ],
  sep24DepositController
);

router.post(
  '/sep24/withdraw',
  [
    body('jwt').notEmpty().isString().withMessage('jwt is required'),
    body('account').notEmpty().isString().withMessage('account is required'),
    body('amount').optional().isString(),
    body('assetCode').optional().isString(),
    body('memo').optional().isString(),
    body('memoType').optional().isString(),
    body('emailAddress').optional().isEmail(),
  ],
  sep24WithdrawController
);

router.get('/sep24/transaction/:id', sep24TransactionStatusController);

// ─── ZARP Routes ──────────────────────────────────────────────────────────────

// SEP-1: discover anchor endpoints and TOML info
router.get('/zarp/info', zarpInfoController);

// Account balances (XLM + ZARP + any other asset)
router.get('/zarp/balances/:publicKey', zarpAccountBalancesController);

// Add ZARP trustline
router.post(
  '/zarp/trustline',
  [
    body('signingSecretKey').optional().isString(),
    body('assetCode').optional().isString(),
    body('assetIssuer').optional().isString(),
  ],
  zarpAddTrustlineController
);

// Send ZARP payment
router.post(
  '/zarp/send',
  [
    body('sourceSecretKey').optional().isString(),
    body('destination').notEmpty().isString().withMessage('destination public key is required'),
    body('amount').notEmpty().isString().withMessage('amount is required'),
    body('assetCode').optional().isString(),
    body('assetIssuer').optional().isString(),
    body('memo').optional().isString(),
  ],
  zarpSendPaymentController
);

export default router;