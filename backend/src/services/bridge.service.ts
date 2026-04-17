const STELLAR_MAINNET_PASSPHRASE = 'Public Global Stellar Network ; September 2015';

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