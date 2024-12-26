import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';

export async function POST(request: Request) {
  try {
    const { wallet_address, signature, message } = await request.json();

    if (!wallet_address || !signature || !message) {
      return NextResponse.json(
        { status: 'error', message: 'Missing required parameters' },
        { status: 400 }
      );
    }

    try {
      const publicKey = new PublicKey(wallet_address);
      const messageBytes = new TextEncoder().encode(message);
      const signatureBytes = Buffer.from(signature, 'base64');
      const publicKeyBytes = publicKey.toBytes();

      const verified = nacl.sign.detached.verify(
        messageBytes,
        signatureBytes,
        publicKeyBytes
      );

      return NextResponse.json({ status: verified ? 'success' : 'error' });
    } catch (err: unknown) {
      console.error('Signature verification failed:', err);
      return NextResponse.json(
        { 
          status: 'error', 
          message: err instanceof Error ? err.message : 'Invalid signature'
        },
        { status: 400 }
      );
    }
  } catch (error: unknown) {
    console.error('Wallet verification error:', error);
    return NextResponse.json(
      { 
        status: 'error', 
        message: error instanceof Error ? error.message : 'An unknown error occurred'
      },
      { status: 500 }
    );
  }
} 