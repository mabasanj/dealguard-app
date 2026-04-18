import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as StellarSdk from 'stellar-sdk';
import {
  getSorobanNetworkSummary,
  ZarpAnchorService,
  sep10Auth,
  sep24Deposit,
  sep24Withdraw,
  sep24TransactionStatus,
  resolveZarpAnchorEndpoints,
  fetchStellarToml,
} from '../services/bridge.service';
import {
  setupEscrow,
  releaseFunds,
  submitSignedXdr,
  validatePublicKey,
  validateSecretKey,
  getAccountBalances,
  addTrustline,
  sendPayment,
} from '../services/stellar.service';

export const getSorobanNetworkController = async (_req: Request, res: Response) => {
  return res.json({
    message: 'Soroban network configuration loaded',
    network: getSorobanNetworkSummary()
  });
};

export const createZarpDepositSessionController = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { account, amount, memo, memoType, callbackUrl, emailAddress } = req.body;
    const service = new ZarpAnchorService();

    return res.json({
      message: 'ZARP deposit session created',
      ...(service.createDepositSession({ account, amount, memo, memoType, callbackUrl, emailAddress }))
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to create ZARP deposit session',
      details: error?.message || 'Unknown error'
    });
  }
};

export const createZarpWithdrawSessionController = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { account, amount, memo, memoType, callbackUrl, emailAddress } = req.body;
    const service = new ZarpAnchorService();

    return res.json({
      message: 'ZARP withdraw session created',
      ...(service.createWithdrawSession({ account, amount, memo, memoType, callbackUrl, emailAddress }))
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to create ZARP withdraw session',
      details: error?.message || 'Unknown error'
    });
  }
};

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

// ─── SEP-24 Controllers ───────────────────────────────────────────────────────

const resolveAnchorUrl = (): string =>
  process.env.ZARP_SEP24_URL || 'https://anchor.zarp.com/sep24';

/**
 * POST /stellar/sep24/auth
 * Performs SEP-10 Web Authentication and returns a JWT for subsequent SEP-24 calls.
 * Body: { account: string, signingSecretKey?: string }
 */
export const sep24AuthController = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { account, signingSecretKey } = req.body;

    const effectiveSecret = signingSecretKey || process.env.STELLAR_APP_SECRET_KEY;
    if (!effectiveSecret) {
      return res.status(400).json({
        error: 'signingSecretKey is required when STELLAR_APP_SECRET_KEY is not configured',
      });
    }

    const anchorUrl = resolveAnchorUrl();
    const token = await sep10Auth(anchorUrl, account, effectiveSecret);

    return res.json({ message: 'SEP-10 authentication successful', token, anchor: anchorUrl });
  } catch (error: any) {
    return res.status(500).json({
      error: 'SEP-10 authentication failed',
      details: error?.response?.data || error?.message || 'Unknown error',
    });
  }
};

/**
 * POST /stellar/sep24/deposit
 * Initiates a SEP-24 interactive deposit session.
 * Body: { jwt, account, amount?, assetCode?, memo?, memoType?, emailAddress? }
 */
export const sep24DepositController = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { jwt, account, amount, assetCode, memo, memoType, emailAddress } = req.body;
    const anchorUrl = resolveAnchorUrl();

    const session = await sep24Deposit({
      anchorUrl,
      jwt,
      assetCode: assetCode || process.env.ZARP_ASSET_CODE || 'ZAR',
      account,
      amount,
      memo,
      memoType,
      emailAddress,
    });

    return res.json({ message: 'SEP-24 deposit session created', ...session });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to create SEP-24 deposit session',
      details: error?.response?.data || error?.message || 'Unknown error',
    });
  }
};

/**
 * POST /stellar/sep24/withdraw
 * Initiates a SEP-24 interactive withdrawal session.
 * Body: { jwt, account, amount?, assetCode?, memo?, memoType?, emailAddress? }
 */
export const sep24WithdrawController = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { jwt, account, amount, assetCode, memo, memoType, emailAddress } = req.body;
    const anchorUrl = resolveAnchorUrl();

    const session = await sep24Withdraw({
      anchorUrl,
      jwt,
      assetCode: assetCode || process.env.ZARP_ASSET_CODE || 'ZAR',
      account,
      amount,
      memo,
      memoType,
      emailAddress,
    });

    return res.json({ message: 'SEP-24 withdrawal session created', ...session });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to create SEP-24 withdrawal session',
      details: error?.response?.data || error?.message || 'Unknown error',
    });
  }
};

/**
 * GET /stellar/sep24/transaction/:id
 * Polls the status of a SEP-24 transaction.
 * Query: jwt (Bearer token)
 */
export const sep24TransactionStatusController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const jwt = (req.headers.authorization?.replace(/^Bearer\s+/i, '') || req.query.jwt) as string;

    if (!id) {
      return res.status(400).json({ error: 'Transaction ID is required' });
    }
    if (!jwt) {
      return res.status(400).json({ error: 'JWT is required (Authorization header or jwt query param)' });
    }

    const anchorUrl = resolveAnchorUrl();
    const transaction = await sep24TransactionStatus(anchorUrl, jwt, id);

    return res.json({ message: 'SEP-24 transaction status fetched', transaction });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to fetch SEP-24 transaction status',
      details: error?.response?.data || error?.message || 'Unknown error',
    });
  }
};

// ─── ZARP Controllers ─────────────────────────────────────────────────────────

/**
 * GET /stellar/zarp/info
 * Returns the ZARP anchor endpoints discovered via SEP-1 stellar.toml.
 */
export const zarpInfoController = async (_req: Request, res: Response) => {
  try {
    const endpoints = await resolveZarpAnchorEndpoints();
    const homeDomain = process.env.ZARP_HOME_DOMAIN || 'zarp.com';
    let tomlInfo = {};
    try {
      tomlInfo = await fetchStellarToml(homeDomain);
    } catch {
      // Non-fatal — return what we have
    }
    return res.json({
      message: 'ZARP anchor info',
      ...endpoints,
      toml: tomlInfo,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to fetch ZARP anchor info',
      details: error?.message || 'Unknown error',
    });
  }
};

/**
 * GET /stellar/zarp/balances/:publicKey
 * Returns all Stellar account balances including ZARP.
 */
export const zarpAccountBalancesController = async (req: Request, res: Response) => {
  try {
    const { publicKey } = req.params;
    if (!publicKey) {
      return res.status(400).json({ error: 'publicKey path param is required' });
    }
    try {
      validatePublicKey(publicKey);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid public key', details: (err as Error).message });
    }

    const balances = await getAccountBalances(publicKey);
    return res.json({ message: 'Account balances fetched', publicKey, balances });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to fetch account balances',
      details: error?.message || 'Unknown error',
    });
  }
};

/**
 * POST /stellar/zarp/trustline
 * Adds a trustline for the ZARP asset on the signing account.
 * Body: { signingSecretKey?, assetCode?, assetIssuer? }
 */
export const zarpAddTrustlineController = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { signingSecretKey, assetCode, assetIssuer } = req.body;
    const effectiveSecret = signingSecretKey || process.env.STELLAR_APP_SECRET_KEY;
    if (!effectiveSecret) {
      return res.status(400).json({
        error: 'signingSecretKey is required when STELLAR_APP_SECRET_KEY is not set',
      });
    }

    try {
      validateSecretKey(effectiveSecret);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid signing secret key', details: (err as Error).message });
    }

    const result = await addTrustline(effectiveSecret, assetCode, assetIssuer);
    return res.json({ message: 'Trustline added successfully', result });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to add trustline',
      details: error?.response?.data?.extras?.result_codes || error?.message || 'Unknown error',
    });
  }
};

/**
 * POST /stellar/zarp/send
 * Send a ZARP (or any Stellar asset) payment from one account to another.
 * Body: { sourceSecretKey?, destination, amount, assetCode?, assetIssuer?, memo? }
 */
export const zarpSendPaymentController = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const { sourceSecretKey, destination, amount, assetCode, assetIssuer, memo } = req.body;
    const effectiveSecret = sourceSecretKey || process.env.STELLAR_APP_SECRET_KEY;
    if (!effectiveSecret) {
      return res.status(400).json({
        error: 'sourceSecretKey is required when STELLAR_APP_SECRET_KEY is not set',
      });
    }

    try {
      validateSecretKey(effectiveSecret);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid source secret key', details: (err as Error).message });
    }

    try {
      validatePublicKey(destination);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid destination public key', details: (err as Error).message });
    }

    const result = await sendPayment(effectiveSecret, destination, amount, assetCode, assetIssuer, memo);
    return res.json({ message: 'Payment sent successfully', result });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to send payment',
      details: error?.response?.data?.extras?.result_codes || error?.message || 'Unknown error',
    });
  }
};