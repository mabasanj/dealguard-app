import { Router } from 'express';
import { body } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { releaseFundsController, setupEscrowController, submitSignedXdrController } from '../controllers/stellar.controller';

const router = Router();

router.use(authenticate);

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

export default router;