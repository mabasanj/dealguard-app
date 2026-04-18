import axios from 'axios';
import * as StellarSdk from 'stellar-sdk';
import * as toml from '@iarna/toml';

const STELLAR_MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';
const STELLAR_TESTNET_PASSPHRASE = 'Test SDF Network ; September 2015';

export interface SorobanNetworkSummary {
  network: 'mainnet';
  horizonUrl: string;
  rpcUrl: string;
  networkPassphrase: string;
  contractId: string | null;
  rails: {
    fiatBridge: string;
    eft: string;
    cards: string;
  };
}

interface ZarpSessionParams {
  account: string;
  amount?: string;
  memo?: string;
  memoType?: string;
  callbackUrl?: string;
  emailAddress?: string;
}

const buildInteractiveUrl = (baseUrl: string, kind: 'deposit' | 'withdraw', params: Record<string, string>) => {
  const query = new URLSearchParams(params);
  return `${baseUrl.replace(/\/$/, '')}/transactions/${kind}/interactive?${query.toString()}`;
};

export const getSorobanNetworkSummary = (): SorobanNetworkSummary => ({
  network: 'mainnet',
  horizonUrl: process.env.STELLAR_HORIZON_URL || 'https://horizon.stellar.org',
  rpcUrl: process.env.STELLAR_RPC_URL || 'https://mainnet.sorobanrpc.com',
  networkPassphrase: process.env.STELLAR_NETWORK_PASSPHRASE || STELLAR_MAINNET_PASSPHRASE,
  contractId: process.env.SOROBAN_ESCROW_CONTRACT_ID || null,
  rails: {
    fiatBridge: 'ZARP Anchor (SEP-24)',
    eft: 'Stitch',
    cards: 'Peach Payments'
  }
});

export class ZarpAnchorService {
  private baseUrl: string;
  private assetCode: string;

  constructor(baseUrl?: string, assetCode?: string) {
    this.baseUrl = baseUrl || process.env.ZARP_SEP24_URL || 'https://anchor.zarp.com/sep24';
    this.assetCode = assetCode || process.env.ZARP_ASSET_CODE || 'ZAR';
  }

  createDepositSession(params: ZarpSessionParams) {
    const interactiveUrl = buildInteractiveUrl(this.baseUrl, 'deposit', {
      asset_code: this.assetCode,
      account: params.account,
      ...(params.amount ? { amount: params.amount } : {}),
      ...(params.memo ? { memo: params.memo } : {}),
      ...(params.memoType ? { memo_type: params.memoType } : {}),
      ...(params.callbackUrl ? { callback_url: params.callbackUrl } : {}),
      ...(params.emailAddress ? { email_address: params.emailAddress } : {}),
      lang: 'en'
    });

    return {
      success: true,
      data: {
        anchor: 'zarp',
        assetCode: this.assetCode,
        network: 'stellar-mainnet',
        interactiveUrl
      }
    };
  }

  createWithdrawSession(params: ZarpSessionParams) {
    const interactiveUrl = buildInteractiveUrl(this.baseUrl, 'withdraw', {
      asset_code: this.assetCode,
      account: params.account,
      ...(params.amount ? { amount: params.amount } : {}),
      ...(params.memo ? { memo: params.memo } : {}),
      ...(params.memoType ? { memo_type: params.memoType } : {}),
      ...(params.callbackUrl ? { callback_url: params.callbackUrl } : {}),
      ...(params.emailAddress ? { email_address: params.emailAddress } : {}),
      lang: 'en'
    });

    return {
      success: true,
      data: {
        anchor: 'zarp',
        assetCode: this.assetCode,
        network: 'stellar-mainnet',
        interactiveUrl
      }
    };
  }
}

// ─── SEP-24 Interactive Deposit / Withdrawal ──────────────────────────────────

function getNetworkPassphrase(): string {
  return process.env.STELLAR_NETWORK === 'PUBLIC'
    ? STELLAR_MAINNET_PASSPHRASE
    : STELLAR_TESTNET_PASSPHRASE;
}

/**
 * SEP-10 Web Authentication — obtain a JWT from an anchor.
 * Steps:
 *  1. GET {anchorUrl}/auth?account={pubKey}   → { transaction: <base64 XDR> }
 *  2. Sign the challenge transaction with the provided keypair.
 *  3. POST {anchorUrl}/auth { transaction: <signed base64 XDR> } → { token }
 */
export async function sep10Auth(
  anchorUrl: string,
  accountPublicKey: string,
  signingSecretKey: string
): Promise<string> {
  const authUrl = `${anchorUrl.replace(/\/$/, '')}/auth`;

  const challengeRes = await axios.get<{ transaction: string }>(authUrl, {
    params: { account: accountPublicKey },
  });

  const networkPassphrase = getNetworkPassphrase();
  const challengeTx = new StellarSdk.Transaction(
    challengeRes.data.transaction,
    networkPassphrase
  );

  const keypair = StellarSdk.Keypair.fromSecret(signingSecretKey);
  challengeTx.sign(keypair);
  const signedXdr = challengeTx.toEnvelope().toXDR('base64');

  const tokenRes = await axios.post<{ token: string }>(authUrl, {
    transaction: signedXdr,
  });

  return tokenRes.data.token;
}

export interface Sep24SessionParams {
  anchorUrl: string;
  jwt: string;
  assetCode: string;
  account: string;
  amount?: string;
  memo?: string;
  memoType?: string;
  emailAddress?: string;
}

export interface Sep24SessionResult {
  url: string;
  id: string;
}

/**
 * SEP-24 Interactive Deposit.
 * Returns the anchor's interactive URL and a transaction ID to poll.
 */
export async function sep24Deposit(
  params: Sep24SessionParams
): Promise<Sep24SessionResult> {
  const { anchorUrl, jwt, assetCode, account, amount, memo, memoType, emailAddress } = params;
  const url = `${anchorUrl.replace(/\/$/, '')}/transactions/deposit/interactive`;

  const body: Record<string, string> = { asset_code: assetCode, account };
  if (amount) body.amount = amount;
  if (memo) body.memo = memo;
  if (memoType) body.memo_type = memoType;
  if (emailAddress) body.email_address = emailAddress;

  const res = await axios.post<{ url: string; id: string; type: string }>(url, body, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
  });

  return { url: res.data.url, id: res.data.id };
}

/**
 * SEP-24 Interactive Withdrawal.
 * Returns the anchor's interactive URL and a transaction ID to poll.
 */
export async function sep24Withdraw(
  params: Sep24SessionParams
): Promise<Sep24SessionResult> {
  const { anchorUrl, jwt, assetCode, account, amount, memo, memoType, emailAddress } = params;
  const url = `${anchorUrl.replace(/\/$/, '')}/transactions/withdraw/interactive`;

  const body: Record<string, string> = { asset_code: assetCode, account };
  if (amount) body.amount = amount;
  if (memo) body.memo = memo;
  if (memoType) body.memo_type = memoType;
  if (emailAddress) body.email_address = emailAddress;

  const res = await axios.post<{ url: string; id: string; type: string }>(url, body, {
    headers: { Authorization: `Bearer ${jwt}`, 'Content-Type': 'application/json' },
  });

  return { url: res.data.url, id: res.data.id };
}

export interface Sep24TransactionRecord {
  id: string;
  status: string;
  kind: 'deposit' | 'withdrawal';
  amount_in?: string;
  amount_out?: string;
  amount_fee?: string;
  more_info_url?: string;
  started_at?: string;
  completed_at?: string;
  stellar_transaction_id?: string;
  external_transaction_id?: string;
}

/**
 * SEP-24 Transaction Status — poll a single transaction's state.
 */
export async function sep24TransactionStatus(
  anchorUrl: string,
  jwt: string,
  transactionId: string
): Promise<Sep24TransactionRecord> {
  const url = `${anchorUrl.replace(/\/$/, '')}/transaction`;

  const res = await axios.get<{ transaction: Sep24TransactionRecord }>(url, {
    params: { id: transactionId },
    headers: { Authorization: `Bearer ${jwt}` },
  });

  return res.data.transaction;
}

// ─── SEP-1: stellar.toml Discovery ───────────────────────────────────────────

export interface StellarTomlInfo {
  ACCOUNTS?: string[];
  VERSION?: string;
  NETWORK_PASSPHRASE?: string;
  HORIZON_URL?: string;
  FEDERATION_SERVER?: string;
  AUTH_SERVER?: string;
  TRANSFER_SERVER?: string;
  TRANSFER_SERVER_SEP0024?: string;
  KYC_SERVER?: string;
  CURRENCIES?: Array<{
    code: string;
    issuer?: string;
    name?: string;
    desc?: string;
    anchor_asset_type?: string;
    anchor_asset?: string;
    status?: string;
  }>;
  [key: string]: unknown;
}

/**
 * Fetch and parse an anchor's stellar.toml (SEP-1).
 * Resolves the well-known URL from the anchor's home domain.
 */
export async function fetchStellarToml(homeDomain: string): Promise<StellarTomlInfo> {
  const url = `https://${homeDomain.replace(/^https?:\/\//, '')}/.well-known/stellar.toml`;
  const res = await axios.get<string>(url, {
    responseType: 'text',
    headers: { Accept: 'text/plain' },
  });

  const parsed = toml.parse(res.data) as unknown as StellarTomlInfo;
  return parsed;
}

/**
 * Resolve the ZARP anchor's transfer server and auth server
 * by fetching their stellar.toml.
 * Falls back to env vars if the domain is not set.
 */
export async function resolveZarpAnchorEndpoints(): Promise<{
  transferServer: string;
  authServer: string;
  assetCode: string;
  assetIssuer: string | undefined;
}> {
  const assetCode = process.env.ZARP_ASSET_CODE || 'ZAR';
  const assetIssuer = process.env.ZARP_ASSET_ISSUER;
  const homeDomain = process.env.ZARP_HOME_DOMAIN || 'zarp.com';

  // Try live discovery first; fall back to env var overrides
  let transferServer = process.env.ZARP_SEP24_URL || '';
  let authServer = '';

  try {
    const tomlInfo = await fetchStellarToml(homeDomain);
    transferServer = tomlInfo.TRANSFER_SERVER_SEP0024 || tomlInfo.TRANSFER_SERVER || transferServer;
    authServer = tomlInfo.AUTH_SERVER || authServer;

    // Resolve issuer from CURRENCIES if not explicitly set
    if (!assetIssuer && tomlInfo.CURRENCIES) {
      const match = tomlInfo.CURRENCIES.find((c) => c.code === assetCode);
      if (match?.issuer) {
        process.env.ZARP_ASSET_ISSUER = match.issuer; // cache for this process
      }
    }
  } catch {
    // Tolerate toml fetch failures — env vars are the fallback
  }

  return { transferServer, authServer, assetCode, assetIssuer };
}