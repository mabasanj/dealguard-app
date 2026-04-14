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