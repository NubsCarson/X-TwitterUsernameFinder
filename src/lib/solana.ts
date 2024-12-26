import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';
import base58 from 'bs58';

export const PAYMENT_AMOUNT = 0.1;
export const AUTH_MESSAGE = 'Verify wallet ownership for Twitter Username Finder';

export interface VerifyResponse {
  status: 'success' | 'error';
  is_pro?: boolean;
  message?: string;
}

export async function verifyWalletOwnership(
  address: string,
  signature: string,
  message: string
): Promise<VerifyResponse> {
  // This is a placeholder implementation
  return {
    status: 'success',
    is_pro: false
  };
}

export async function registerProUser(
  address: string,
  signature: string,
  message: string
): Promise<VerifyResponse> {
  // This is a placeholder implementation
  return {
    status: 'success',
    is_pro: true
  };
}

export async function handlePayment(
  connection: Connection,
  fromPubkey: PublicKey,
  signTransaction: (transaction: Transaction) => Promise<Transaction>
): Promise<{ status: 'success' | 'error'; message?: string }> {
  try {
    const toPubkey = new PublicKey(RECIPIENT_ADDRESS);
    const lamports = PAYMENT_AMOUNT * LAMPORTS_PER_SOL;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey,
        lamports,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = fromPubkey;

    const signed = await signTransaction(transaction);
    const signature = await connection.sendRawTransaction(signed.serialize());
    await connection.confirmTransaction(signature);

    return { status: 'success' };
  } catch (err) {
    console.error('Payment error:', err);
    return {
      status: 'error',
      message: err.message,
    };
  }
} 