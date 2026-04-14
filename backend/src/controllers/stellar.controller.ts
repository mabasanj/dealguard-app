import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as StellarSdk from 'stellar-sdk';
import { setupEscrow, releaseFunds, submitSignedXdr, validatePublicKey, validateSecretKey } from '../services/stellar.service';

export const setupEscrowController = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { escrowSecret, buyerPubKey, sellerPubKey, appPubKey } = req.body;

    // Validate secret key format first
    try {
      validateSecretKey(escrowSecret);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid escrow secret key', details: (err as Error).message });
    }

    let escrowKeyPair: StellarSdk.Keypair;
    try {
      escrowKeyPair = StellarSdk.Keypair.fromSecret(escrowSecret);
    } catch (err) {
      return res.status(400).json({ error: 'Failed to parse escrow secret key', details: (err as Error).message });
    }

    let finalAppPubKey = appPubKey as string | undefined;
    if (!finalAppPubKey && process.env.STELLAR_APP_SECRET_KEY) {
      finalAppPubKey = StellarSdk.Keypair.fromSecret(process.env.STELLAR_APP_SECRET_KEY).publicKey();
    }

    if (!finalAppPubKey) {
      return res.status(400).json({ error: 'appPubKey is required when STELLAR_APP_SECRET_KEY is not set' });
    }

    const txResult = await setupEscrow(escrowKeyPair, buyerPubKey, sellerPubKey, finalAppPubKey);

    return res.json({
      message: 'Stellar escrow setup successful',
      escrowPublicKey: escrowKeyPair.publicKey(),
      result: txResult,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to setup Stellar escrow',
      details: error?.message || 'Unknown error',
    });
  }
};

export const releaseFundsController = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { escrowPubKey, sellerPubKey, appSecretKey, amount, assetCode, assetIssuer } = req.body;

    const effectiveAppSecret = appSecretKey || process.env.STELLAR_APP_SECRET_KEY;
    if (!effectiveAppSecret) {
      return res.status(400).json({ error: 'appSecretKey is required when STELLAR_APP_SECRET_KEY is not set' });
    }

    // Validate secret key
    try {
      validateSecretKey(effectiveAppSecret);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid app secret key', details: (err as Error).message });
    }

    let appKeyPair: StellarSdk.Keypair;
    try {
      appKeyPair = StellarSdk.Keypair.fromSecret(effectiveAppSecret);
    } catch (err) {
      return res.status(400).json({ error: 'Failed to parse app secret key', details: (err as Error).message });
    }

    const asset = assetCode && assetIssuer
      ? new StellarSdk.Asset(assetCode, assetIssuer)
      : StellarSdk.Asset.native();

    const xdr = await releaseFunds(
      escrowPubKey,
      sellerPubKey,
      appKeyPair,
      amount || '100.0000000',
      asset
    );

    return res.json({
      message: 'Release transaction prepared',
      xdr,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to prepare release transaction',
      details: error?.message || 'Unknown error',
    });
  }
};

export const submitSignedXdrController = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { xdr } = req.body;
    const result = await submitSignedXdr(xdr);

    return res.json({
      message: 'Signed transaction submitted successfully',
      result,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to submit signed transaction',
      details: error?.response?.data || error?.message || 'Unknown error',
    });
  }
};