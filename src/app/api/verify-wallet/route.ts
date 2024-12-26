import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import base58 from 'bs58';
import nacl from 'tweetnacl';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { wallet_address, signature, message } = await request.json();

    // Verify the signature
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

      if (!verified) {
        return NextResponse.json(
          { status: 'error', message: 'Invalid signature' },
          { status: 400 }
        );
      }
    } catch (err) {
      console.error('Signature verification failed:', err);
      return NextResponse.json(
        { status: 'error', message: `Invalid signature: ${err.message}` },
        { status: 400 }
      );
    }

    // Check if user is already pro
    const client = await clientPromise;
    const db = client.db();
    const proUser = await db.collection('pro_users').findOne({
      wallet_address
    });

    return NextResponse.json({
      status: 'success',
      is_pro: !!proUser
    });
  } catch (err) {
    console.error('Wallet verification error:', err);
    return NextResponse.json(
      { status: 'error', message: err.message },
      { status: 500 }
    );
  }
} 