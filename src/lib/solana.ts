import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { sign } from 'tweetnacl';
import { decode as base58Decode } from 'bs58';

const RECIPIENT_ADDRESS = process.env.RECIPIENT_ADDRESS || '';
const PAYMENT_AMOUNT = 0.1; // SOL
const RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';

export async function verifyWalletSignature(
  walletAddress: string,
  signature: string,
  message: string
): Promise<boolean> {
  try {
    const publicKeyBytes = base58Decode(walletAddress);
    const signatureBytes = Buffer.from(signature, 'base64');
    const messageBytes = Buffer.from(message, 'base64');

    return sign.detached.verify(messageBytes, signatureBytes, publicKeyBytes);
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

export async function verifyPayment(
  walletAddress: string
): Promise<{ status: 'success' | 'error'; message?: string }> {
  try {
    const connection = new Connection(RPC_ENDPOINT);
    const fromPubkey = new PublicKey(walletAddress);
    const toPubkey = new PublicKey(RECIPIENT_ADDRESS);

    // Get recent transactions
    const transactions = await connection.getSignaturesForAddress(fromPubkey, { limit: 10 });

    for (const tx of transactions) {
      const transaction = await connection.getTransaction(tx.signature);
      if (!transaction || !transaction.meta) continue;

      // Check if this is a payment to our address
      const instruction = transaction.transaction.message.instructions[0];
      const programId = transaction.transaction.message.accountKeys[instruction.programIdIndex];
      const postBalance = transaction.meta.postBalances[1];
      const preBalance = transaction.meta.preBalances[1];
      
      if (
        programId.equals(SystemProgram.programId) &&
        postBalance - preBalance >= PAYMENT_AMOUNT * LAMPORTS_PER_SOL
      ) {
        return { status: 'success' };
      }
    }

    return { status: 'error', message: 'Payment not found' };
  } catch (error) {
    console.error('Error verifying payment:', error);
    return { status: 'error', message: 'Failed to verify payment' };
  }
}

export async function processPayment(
  walletAddress: string,
  connection: Connection
): Promise<{ status: 'success' | 'error'; message?: string }> {
  try {
    const toPubkey = new PublicKey(RECIPIENT_ADDRESS);
    const lamports = PAYMENT_AMOUNT * LAMPORTS_PER_SOL;

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: new PublicKey(walletAddress),
        toPubkey,
        lamports,
      })
    );

    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = new PublicKey(walletAddress);

    const serializedTransaction = transaction.serialize({ requireAllSignatures: false });
    const transactionBase64 = serializedTransaction.toString('base64');

    return {
      status: 'success',
      message: transactionBase64,
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    return { status: 'error', message: 'Failed to process payment' };
  }
} 