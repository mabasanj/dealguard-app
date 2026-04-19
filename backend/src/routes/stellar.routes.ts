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
  sep10ChallengeController,
  sep10ServerAuthController,
  sep12GetOurCustomerController,
  sep12PutOurCustomerController,
  sep12DeleteOurCustomerController,
  sep12AnchorGetCustomerController,
  sep12AnchorPutCustomerController,
  sep12AnchorDeleteCustomerController,
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

// ─── SEP-10: Web Authentication (Server) ─────────────────────────────────────

// GET challenge — returns a transaction the wallet must sign
router.get('/sep10/challenge', sep10ChallengeController);

// POST auth — verify signed challenge, return platform JWT
router.post(
  '/sep10/auth',
  [
    body('transaction').notEmpty().isString().withMessage('transaction (signed XDR) is required'),
  ],
  sep10ServerAuthController
);

// ─── SEP-12: KYC (Our Platform) ──────────────────────────────────────────────

// GET our stored KYC record for a Stellar account
router.get('/sep12/customer', sep12GetOurCustomerController);

// PUT / create-or-update our KYC record
router.put(
  '/sep12/customer',
  [
    body('account').notEmpty().isString().withMessage('account (Stellar public key) is required'),
    body('first_name').optional().isString(),
    body('last_name').optional().isString(),
    body('email_address').optional().isEmail().withMessage('email_address must be a valid email'),
    body('phone_number').optional().isString(),
    body('birth_date').optional().isString(),
    body('address').optional().isString(),
    body('city').optional().isString(),
    body('country_code').optional().isString().isLength({ min: 2, max: 3 }),
    body('postal_code').optional().isString(),
    body('id_type').optional().isIn(['passport', 'id_document', 'drivers_license']),
    body('id_number').optional().isString(),
    body('id_expiration').optional().isString(),
  ],
  sep12PutOurCustomerController
);

// DELETE our KYC record
router.delete('/sep12/customer', sep12DeleteOurCustomerController);

// ─── SEP-12: Anchor KYC Proxy ─────────────────────────────────────────────────

// GET KYC status from ZARP anchor
router.get('/sep12/anchor/customer', sep12AnchorGetCustomerController);

// PUT KYC data to ZARP anchor
router.put('/sep12/anchor/customer', sep12AnchorPutCustomerController);

// DELETE KYC data at ZARP anchor
router.delete('/sep12/anchor/customer', sep12AnchorDeleteCustomerController);

export default router;