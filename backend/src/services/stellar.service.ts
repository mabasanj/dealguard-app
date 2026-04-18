import * as StellarSdk from 'stellar-sdk';

const HORIZON_URL = process.env.STELLAR_HORIZON_URL || 'https://horizon-testnet.stellar.org';
const NETWORK_PASSPHRASE = process.env.STELLAR_NETWORK === 'PUBLIC'
  ? StellarSdk.Networks.PUBLIC
  : StellarSdk.Networks.TESTNET;

const server = new StellarSdk.Server(HORIZON_URL);

// Helper: Validate Stellar public key format
export function validatePublicKey(pubKey: string): void {
  if (!pubKey || typeof pubKey !== 'string') {
    throw new Error('Public key must be a non-empty string');
  }
  if (!pubKey.startsWith('G') || pubKey.length !== 56) {
    throw new Error('Invalid public key format. Must start with G and be 56 characters');
  }
  // Try to decode to validate format
  try {
    StellarSdk.StrKey.decodeEd25519PublicKey(pubKey);
  } catch (err) {
    throw new Error('Invalid public key: failed checksum validation');
  }
}

// Helper: Validate secret key format
export function validateSecretKey(secKey: string): void {
  if (!secKey || typeof secKey !== 'string') {
    throw new Error('Secret key must be a non-empty string');
  }
  if (!secKey.startsWith('S') || secKey.length !== 56) {
    throw new Error('Invalid secret key format. Must start with S and be 56 characters');
  }
  try {
    StellarSdk.StrKey.decodeEd25519SecretSeed(secKey);
  } catch (err) {
    throw new Error('Invalid secret key: failed checksum validation');
  }
}

export async function setupEscrow(
  escrowKeyPair: StellarSdk.Keypair,
  buyerPubKey: string,
  sellerPubKey: string,
  appPubKey: string
) {
  try {
    // Validate all public keys
    validatePublicKey(buyerPubKey);
    validatePublicKey(sellerPubKey);
    validatePublicKey(appPubKey);
    validatePublicKey(escrowKeyPair.publicKey());

    const sourceAccount = await server.loadAccount(escrowKeyPair.publicKey());

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.setOptions({
          signer: { ed25519PublicKey: sellerPubKey, weight: 1 },
        })
      )
      .addOperation(
        StellarSdk.Operation.setOptions({
          signer: { ed25519PublicKey: buyerPubKey, weight: 1 },
        })
      )
      .addOperation(
        StellarSdk.Operation.setOptions({
          signer: { ed25519PublicKey: appPubKey, weight: 1 },
        })
      )
      .addOperation(
        StellarSdk.Operation.setOptions({
          masterWeight: 0,
          lowThreshold: 2,
          medThreshold: 2,
          highThreshold: 2,
        })
      )
      .setTimeout(300)
      .build();

    transaction.sign(escrowKeyPair);
    const result = await server.submitTransaction(transaction);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to setup escrow: ${error.message}`);
    }
    throw new Error('Failed to setup escrow: unknown error');
  }
}

export async function releaseFunds(
  escrowPubKey: string,
  sellerPubKey: string,
  appKeyPair: StellarSdk.Keypair,
  amount: string = '100.0000000',
  asset: StellarSdk.Asset = StellarSdk.Asset.native()
) {
  try {
    // Validate keys
    validatePublicKey(escrowPubKey);
    validatePublicKey(sellerPubKey);
    validatePublicKey(appKeyPair.publicKey());

    // Validate amount
    if (isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      throw new Error('Amount must be a positive number');
    }

    const escrowAccount = await server.loadAccount(escrowPubKey);

    const transaction = new StellarSdk.TransactionBuilder(escrowAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: NETWORK_PASSPHRASE,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: sellerPubKey,
          asset,
          amount,
        })
      )
      .setTimeout(300)
      .build();

    transaction.sign(appKeyPair);
    return transaction.toXDR();
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to prepare release funds XDR: ${error.message}`);
    }
    throw new Error('Failed to prepare release funds XDR: unknown error');
  }
}

export async function submitSignedXdr(xdr: string) {
  try {
    if (!xdr || typeof xdr !== 'string') {
      throw new Error('XDR must be a non-empty string');
    }

    const tx = new StellarSdk.Transaction(xdr, NETWORK_PASSPHRASE);
    const result = await server.submitTransaction(tx);
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to submit transaction: ${error.message}`);
    }
    throw new Error('Failed to submit transaction: unknown error');
  }
}

// ─── ZARP Asset Helpers ───────────────────────────────────────────────────────

export function getZarpAsset(): StellarSdk.Asset {
  const code = process.env.ZARP_ASSET_CODE || 'ZAR';
  const issuer = process.env.ZARP_ASSET_ISSUER;
  if (!issuer) {
    throw new Error(
      'ZARP_ASSET_ISSUER env var is not set. ' +
      'Set it to the ZARP asset issuer public key.'
    );
  }
  return new StellarSdk.Asset(code, issuer);
}

export interface AccountBalance {
  assetType: string;
  assetCode?: string;
  assetIssuer?: string;
  balance: string;
  limit?: string;
}

/**
 * Fetch all balances for a Stellar account.
 * Returns XLM native + any issued asset balances.
 */
export async function getAccountBalances(publicKey: string): Promise<AccountBalance[]> {
  validatePublicKey(publicKey);

  const account = await server.loadAccount(publicKey);

  return account.balances.map((b) => {
    if (b.asset_type === 'native') {
      return { assetType: 'native', assetCode: 'XLM', balance: b.balance };
    }
    const issued = b as StellarSdk.Horizon.BalanceLine<'credit_alphanum4' | 'credit_alphanum12'>;
    return {
      assetType: issued.asset_type,
      assetCode: issued.asset_code,
      assetIssuer: issued.asset_issuer,
      balance: issued.balance,
      limit: issued.limit,
    };
  });
}

/**
 * Add a trustline for the ZARP asset (or any issued asset).
 * The signing keypair must be the account that needs the trustline.
 */
export async function addTrustline(
  signingSecretKey: string,
  assetCode?: string,
  assetIssuer?: string
): Promise<any> {
  validateSecretKey(signingSecretKey);

  const keypair = StellarSdk.Keypair.fromSecret(signingSecretKey);
  const asset = (assetCode && assetIssuer)
    ? new StellarSdk.Asset(assetCode, assetIssuer)
    : getZarpAsset();

  const account = await server.loadAccount(keypair.publicKey());
  const tx = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  })
    .addOperation(StellarSdk.Operation.changeTrust({ asset }))
    .setTimeout(300)
    .build();

  tx.sign(keypair);
  return server.submitTransaction(tx);
}

/**
 * Send a ZARP (or any asset) payment from one account to another.
 */
export async function sendPayment(
  sourceSecretKey: string,
  destinationPublicKey: string,
  amount: string,
  assetCode?: string,
  assetIssuer?: string,
  memo?: string
): Promise<any> {
  validateSecretKey(sourceSecretKey);
  validatePublicKey(destinationPublicKey);

  if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
    throw new Error('Amount must be a positive number');
  }

  const keypair = StellarSdk.Keypair.fromSecret(sourceSecretKey);
  const asset = (assetCode && assetIssuer)
    ? new StellarSdk.Asset(assetCode, assetIssuer)
    : getZarpAsset();

  const account = await server.loadAccount(keypair.publicKey());
  const builder = new StellarSdk.TransactionBuilder(account, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: NETWORK_PASSPHRASE,
  }).addOperation(
    StellarSdk.Operation.payment({
      destination: destinationPublicKey,
      asset,
      amount,
    })
  );

  if (memo) {
    builder.addMemo(StellarSdk.Memo.text(memo));
  }

  const tx = builder.setTimeout(300).build();
  tx.sign(keypair);
  return server.submitTransaction(tx);
}