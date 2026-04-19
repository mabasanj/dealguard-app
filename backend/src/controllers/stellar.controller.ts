import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import * as StellarSdk from 'stellar-sdk';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import {
  getSorobanNetworkSummary,
  ZarpAnchorService,
  sep10Auth,
  sep24Deposit,
  sep24Withdraw,
  sep24TransactionStatus,
  resolveZarpAnchorEndpoints,
  fetchStellarToml,
  generateSep10Challenge,
  verifySep10Challenge,
  sep12GetCustomer,
  sep12PutCustomer,
  sep12DeleteCustomer,
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

const prisma = new PrismaClient();

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

// ─── SEP-10: Web Authentication (Server) ─────────────────────────────────────

/**
 * GET /stellar/sep10/challenge?account=<public_key>
 * Generate a SEP-10 challenge transaction the client must sign.
 */
export const sep10ChallengeController = async (req: Request, res: Response) => {
  try {
    const account = req.query.account as string;
    if (!account) {
      return res.status(400).json({ error: 'account query param is required' });
    }
    try {
      validatePublicKey(account);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid Stellar public key', details: (err as Error).message });
    }

    const { xdr, networkPassphrase } = generateSep10Challenge(account);
    return res.json({ transaction: xdr, network_passphrase: networkPassphrase });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to generate SEP-10 challenge',
      details: error?.message || 'Unknown error',
    });
  }
};

/**
 * POST /stellar/sep10/auth
 * Verify the client-signed challenge and return a platform JWT.
 * Body: { transaction: <signed base64 XDR> }
 */
export const sep10ServerAuthController = async (req: Request, res: Response) => {
  try {
    const { transaction } = req.body;
    if (!transaction) {
      return res.status(400).json({ error: 'transaction (signed XDR) is required' });
    }

    let clientAccount: string;
    try {
      clientAccount = verifySep10Challenge(transaction);
    } catch (err) {
      return res.status(401).json({
        error: 'SEP-10 challenge verification failed',
        details: (err as Error).message,
      });
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return res.status(500).json({ error: 'JWT_SECRET is not configured' });
    }

    const token = jwt.sign(
      { sub: clientAccount, account: clientAccount, iat: Math.floor(Date.now() / 1000) },
      jwtSecret,
      { expiresIn: '24h' }
    );

    return res.json({ token, account: clientAccount });
  } catch (error: any) {
    return res.status(500).json({
      error: 'SEP-10 authentication failed',
      details: error?.message || 'Unknown error',
    });
  }
};

// ─── SEP-12: KYC (Our Platform Storage) ──────────────────────────────────────

/**
 * GET /stellar/sep12/customer?account=<stellar_public_key>
 * Returns the KYC record for a Stellar account stored in our database.
 */
export const sep12GetOurCustomerController = async (req: Request, res: Response) => {
  try {
    const account = req.query.account as string;
    if (!account) {
      return res.status(400).json({ error: 'account query param is required' });
    }

    const customer = await prisma.sep12Customer.findUnique({
      where: { stellarAccount: account },
    });

    if (!customer) {
      return res.status(404).json({
        id: '',
        status: 'NEEDS_INFO',
        fields: {
          first_name: { type: 'string', description: 'First name' },
          last_name: { type: 'string', description: 'Last name' },
          email_address: { type: 'string', description: 'Email address' },
          birth_date: { type: 'date', description: 'Date of birth (YYYY-MM-DD)' },
          id_type: { type: 'string', description: 'ID type (passport, id_document, drivers_license)' },
          id_number: { type: 'string', description: 'Government ID number' },
          country_code: { type: 'string', description: 'Country of residence (ISO 3-letter code)' },
        },
        message: 'No KYC record found. Please submit your identity information.',
      });
    }

    return res.json({
      id: customer.id,
      status: customer.status,
      message: customer.statusMessage,
      stellarAccount: customer.stellarAccount,
      provided_fields: {
        first_name: { type: 'string', status: customer.firstName ? 'ACCEPTED' : 'EMPTY' },
        last_name: { type: 'string', status: customer.lastName ? 'ACCEPTED' : 'EMPTY' },
        email_address: { type: 'string', status: customer.email ? 'ACCEPTED' : 'EMPTY' },
        birth_date: { type: 'date', status: customer.dateOfBirth ? 'ACCEPTED' : 'EMPTY' },
        id_type: { type: 'string', status: customer.idType ? 'ACCEPTED' : 'EMPTY' },
        id_number: { type: 'string', status: customer.idNumber ? 'ACCEPTED' : 'EMPTY' },
        country_code: { type: 'string', status: customer.country ? 'ACCEPTED' : 'EMPTY' },
      },
      anchorCustomerId: customer.anchorCustomerId,
      anchorStatus: customer.anchorStatus,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to fetch KYC record',
      details: error?.message || 'Unknown error',
    });
  }
};

/**
 * PUT /stellar/sep12/customer
 * Create or update a KYC record in our database.
 * Body: { account, first_name?, last_name?, email_address?, birth_date?, id_type?,
 *         id_number?, id_expiration?, country_code?, address?, city?, postal_code?, phone_number? }
 */
export const sep12PutOurCustomerController = async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: 'Validation failed', details: errors.array() });
    }

    const {
      account,
      first_name, last_name, email_address, phone_number, birth_date,
      address, city, country_code, postal_code,
      id_type, id_number, id_expiration,
    } = req.body;

    if (!account) {
      return res.status(400).json({ error: 'account (Stellar public key) is required' });
    }

    try {
      validatePublicKey(account);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid Stellar public key', details: (err as Error).message });
    }

    const data = {
      ...(first_name !== undefined && { firstName: first_name }),
      ...(last_name !== undefined && { lastName: last_name }),
      ...(email_address !== undefined && { email: email_address }),
      ...(phone_number !== undefined && { phone: phone_number }),
      ...(birth_date !== undefined && { dateOfBirth: birth_date }),
      ...(address !== undefined && { address }),
      ...(city !== undefined && { city }),
      ...(country_code !== undefined && { country: country_code }),
      ...(postal_code !== undefined && { postalCode: postal_code }),
      ...(id_type !== undefined && { idType: id_type }),
      ...(id_number !== undefined && { idNumber: id_number }),
      ...(id_expiration !== undefined && { idExpiry: id_expiration }),
    };

    const customer = await prisma.sep12Customer.upsert({
      where: { stellarAccount: account },
      create: { stellarAccount: account, status: 'NEEDS_INFO', ...data },
      update: data,
    });

    // Auto-advance status if required fields are present
    if (customer.firstName && customer.lastName && customer.idNumber && customer.idType && customer.country) {
      await prisma.sep12Customer.update({
        where: { stellarAccount: account },
        data: { status: 'PENDING' },
      });
    }

    const updated = await prisma.sep12Customer.findUnique({ where: { stellarAccount: account } });

    return res.json({
      id: updated!.id,
      status: updated!.status,
      message: 'KYC record saved successfully',
    });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to save KYC record',
      details: error?.message || 'Unknown error',
    });
  }
};

/**
 * DELETE /stellar/sep12/customer?account=<stellar_public_key>
 * Remove a KYC record from our database.
 */
export const sep12DeleteOurCustomerController = async (req: Request, res: Response) => {
  try {
    const account = req.query.account as string;
    if (!account) {
      return res.status(400).json({ error: 'account query param is required' });
    }

    const existing = await prisma.sep12Customer.findUnique({ where: { stellarAccount: account } });
    if (!existing) {
      return res.status(404).json({ error: 'No KYC record found for this account' });
    }

    await prisma.sep12Customer.delete({ where: { stellarAccount: account } });
    return res.json({ message: 'KYC record deleted successfully' });
  } catch (error: any) {
    return res.status(500).json({
      error: 'Failed to delete KYC record',
      details: error?.message || 'Unknown error',
    });
  }
};

// ─── SEP-12: KYC Anchor Proxy ─────────────────────────────────────────────────

const resolveKycServer = async (): Promise<string> => {
  if (process.env.ZARP_KYC_URL) return process.env.ZARP_KYC_URL;
  try {
    const { kycServer } = await resolveZarpAnchorEndpoints();
    return kycServer || '';
  } catch {
    return '';
  }
};

/**
 * GET /stellar/sep12/anchor/customer?account=<key>
 * Proxy KYC status check to the ZARP anchor's SEP-12 server.
 * Requires: Authorization: Bearer <sep10-jwt>
 */
export const sep12AnchorGetCustomerController = async (req: Request, res: Response) => {
  try {
    const jwtToken = req.headers.authorization?.replace(/^Bearer\s+/i, '') || (req.query.jwt as string);
    const account = req.query.account as string;

    if (!jwtToken) return res.status(400).json({ error: 'Authorization JWT is required' });
    if (!account) return res.status(400).json({ error: 'account query param is required' });

    const kycServer = await resolveKycServer();
    if (!kycServer) {
      return res.status(503).json({ error: 'Anchor KYC server is not configured (ZARP_KYC_URL)' });
    }

    const customerData = await sep12GetCustomer(kycServer, jwtToken, account, req.query.type as string);
    return res.json(customerData);
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: 'Failed to fetch KYC status from anchor',
      details: error?.response?.data || error?.message || 'Unknown error',
    });
  }
};

/**
 * PUT /stellar/sep12/anchor/customer
 * Proxy KYC submission to the ZARP anchor's SEP-12 server.
 * Requires: Authorization: Bearer <sep10-jwt>
 * Body: SEP-12 customer fields
 */
export const sep12AnchorPutCustomerController = async (req: Request, res: Response) => {
  try {
    const jwtToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    if (!jwtToken) return res.status(400).json({ error: 'Authorization JWT is required' });

    const kycServer = await resolveKycServer();
    if (!kycServer) {
      return res.status(503).json({ error: 'Anchor KYC server is not configured (ZARP_KYC_URL)' });
    }

    const result = await sep12PutCustomer(kycServer, jwtToken, req.body);

    // Mirror the anchor's response back into our Sep12Customer record if we have one
    if (req.body.account) {
      await prisma.sep12Customer.updateMany({
        where: { stellarAccount: req.body.account },
        data: {
          anchorCustomerId: result.id,
          anchorStatus: result.status,
        },
      });
    }

    return res.json(result);
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: 'Failed to submit KYC to anchor',
      details: error?.response?.data || error?.message || 'Unknown error',
    });
  }
};

/**
 * DELETE /stellar/sep12/anchor/customer?account=<key>
 * Proxy KYC deletion to the ZARP anchor's SEP-12 server.
 * Requires: Authorization: Bearer <sep10-jwt>
 */
export const sep12AnchorDeleteCustomerController = async (req: Request, res: Response) => {
  try {
    const jwtToken = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const account = req.query.account as string;

    if (!jwtToken) return res.status(400).json({ error: 'Authorization JWT is required' });
    if (!account) return res.status(400).json({ error: 'account query param is required' });

    const kycServer = await resolveKycServer();
    if (!kycServer) {
      return res.status(503).json({ error: 'Anchor KYC server is not configured (ZARP_KYC_URL)' });
    }

    await sep12DeleteCustomer(kycServer, jwtToken, account);
    return res.json({ message: 'Customer KYC data deleted at anchor' });
  } catch (error: any) {
    return res.status(error?.response?.status || 500).json({
      error: 'Failed to delete KYC at anchor',
      details: error?.response?.data || error?.message || 'Unknown error',
    });
  }
};