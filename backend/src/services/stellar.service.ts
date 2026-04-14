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