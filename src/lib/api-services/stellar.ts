import { apiClient } from '../api-client';
import * as freighter from '@stellar/freighter-api';

export interface StellarSetupEscrowPayload {
  escrowSecret: string;
  buyerPubKey: string;
  sellerPubKey: string;
  appPubKey?: string;
}

export interface StellarReleaseXdrPayload {
  escrowPubKey: string;
  sellerPubKey: string;
  appSecretKey?: string;
  amount?: string;
  assetCode?: string;
  assetIssuer?: string;
}

export interface StellarSubmitSignedXdrPayload {
  xdr: string;
}

export interface StellarReleaseFlowParams {
  escrowPubKey: string;
  sellerPubKey: string;
  amount?: string;
  assetCode?: string;
  assetIssuer?: string;
  appSecretKey?: string;
}

export interface StellarReleaseFlowResult {
  unsignedForBuyerXdr: string;
  signedByBuyerXdr: string;
  submitResult: any;
}

export type BuyerSignXdrFn = (xdr: string) => Promise<string>;

// Sign XDR using Freighter wallet
export const signWithFreighter = async (xdr: string): Promise<string> => {
  const isAllowed = await freighter.isAllowed();
  if (!isAllowed) {
    throw new Error('Freighter wallet is not available or not authorized');
  }

  try {
    const result = await freighter.signTransaction(xdr);
    return result.signedTxXdr;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Freighter signing failed: ${error.message}`);
    }
    throw new Error('Freighter signing failed');
  }
};

export const stellarApi = {
  setupEscrow: async (payload: StellarSetupEscrowPayload): Promise<any> => {
    return apiClient.post('/stellar/setup-escrow', payload);
  },

  releaseFundsXdr: async (payload: StellarReleaseXdrPayload): Promise<{ message: string; xdr: string }> => {
    return apiClient.post('/stellar/release-funds-xdr', payload);
  },

  submitSignedXdr: async (payload: StellarSubmitSignedXdrPayload): Promise<any> => {
    return apiClient.post('/stellar/submit-signed-xdr', payload);
  },

  // End-to-end helper:
  // 1) Ask backend to prepare app-signed XDR
  // 2) Ask buyer wallet to add buyer signature (via Freighter or custom callback)
  // 3) Submit signed XDR back to backend for Horizon broadcast
  completeReleaseFlow: async (
    params: StellarReleaseFlowParams,
    signWithBuyerWallet?: BuyerSignXdrFn
  ): Promise<StellarReleaseFlowResult> => {
    const prepared = await stellarApi.releaseFundsXdr(params);
    const unsignedForBuyerXdr = prepared.xdr;

    // Use provided callback or default to Freighter
    const signer = signWithBuyerWallet || signWithFreighter;
    const signedByBuyerXdr = await signer(unsignedForBuyerXdr);

    const submitResult = await stellarApi.submitSignedXdr({ xdr: signedByBuyerXdr });

    return {
      unsignedForBuyerXdr,
      signedByBuyerXdr,
      submitResult,
    };
  },
};

// ─── SEP-24 Interactive Deposit / Withdrawal ─────────────────────────────────

export interface Sep24AuthPayload {
  account: string;
  signingSecretKey?: string;
}

export interface Sep24SessionPayload {
  jwt: string;
  account: string;
  amount?: string;
  assetCode?: string;
  memo?: string;
  memoType?: string;
  emailAddress?: string;
}

export interface Sep24SessionResult {
  message: string;
  url: string;
  id: string;
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

export const sep24Api = {
  /**
   * Step 1 — Obtain a SEP-10 JWT from the anchor.
   * The JWT is short-lived and must be used immediately for deposit/withdraw calls.
   */
  auth: async (payload: Sep24AuthPayload): Promise<{ token: string; anchor: string }> => {
    return apiClient.post('/stellar/sep24/auth', payload);
  },

  /**
   * Step 2a — Start an interactive deposit session.
   * Returns the anchor-provided `url` (open in a popup/iframe) and `id` to poll.
   */
  deposit: async (payload: Sep24SessionPayload): Promise<Sep24SessionResult> => {
    return apiClient.post('/stellar/sep24/deposit', payload);
  },

  /**
   * Step 2b — Start an interactive withdrawal session.
   * Returns the anchor-provided `url` (open in a popup/iframe) and `id` to poll.
   */
  withdraw: async (payload: Sep24SessionPayload): Promise<Sep24SessionResult> => {
    return apiClient.post('/stellar/sep24/withdraw', payload);
  },

  /**
   * Step 3 — Poll the anchor for a transaction's status.
   * Pass the JWT as the `jwt` query param or Authorization header.
   */
  transactionStatus: async (
    transactionId: string,
    jwt: string
  ): Promise<{ transaction: Sep24TransactionRecord }> => {
    return apiClient.get(`/stellar/sep24/transaction/${transactionId}?jwt=${encodeURIComponent(jwt)}`);
  },
};

// ─── ZARP API ─────────────────────────────────────────────────────────────────

export interface ZarpBalance {
  assetType: string;
  assetCode?: string;
  assetIssuer?: string;
  balance: string;
  limit?: string;
}

export interface ZarpAnchorInfo {
  transferServer: string;
  authServer: string;
  assetCode: string;
  assetIssuer?: string;
  toml: Record<string, unknown>;
}

export interface ZarpSendPayload {
  sourceSecretKey?: string;
  destination: string;
  amount: string;
  assetCode?: string;
  assetIssuer?: string;
  memo?: string;
}

export interface ZarpTrustlinePayload {
  signingSecretKey?: string;
  assetCode?: string;
  assetIssuer?: string;
}

export const zarpApi = {
  /** Fetch ZARP anchor info via SEP-1 stellar.toml discovery. */
  info: async (): Promise<ZarpAnchorInfo> => {
    return apiClient.get('/stellar/zarp/info');
  },

  /** Get all Stellar balances (XLM + ZARP + others) for a public key. */
  balances: async (publicKey: string): Promise<{ balances: ZarpBalance[] }> => {
    return apiClient.get(`/stellar/zarp/balances/${encodeURIComponent(publicKey)}`);
  },

  /** Establish a ZARP trustline on the signing account. */
  addTrustline: async (payload: ZarpTrustlinePayload): Promise<any> => {
    return apiClient.post('/stellar/zarp/trustline', payload);
  },

  /** Send a ZARP payment to another Stellar account. */
  send: async (payload: ZarpSendPayload): Promise<any> => {
    return apiClient.post('/stellar/zarp/send', payload);
  },
};