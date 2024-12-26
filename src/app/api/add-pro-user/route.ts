import { NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import nacl from 'tweetnacl';
import clientPromise from '@/lib/mongodb';

export async function POST(request: Request) {
  try {
    const { wallet_address, signature, message } = await request.json();

    // Check if user is already pro
    const client = await clientPromise;
    const db = client.db();
    const existingUser = await db.collection('pro_users').findOne({
      wallet_address
    });

    if (existingUser) {
      return NextResponse.json({ status: 'success' });
    }

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

    // Add user to pro users
    await db.collection('pro_users').insertOne({
      wallet_address,
      created_at: new Date()
    });

    return NextResponse.json({ status: 'success' });
  } catch (err) {
    console.error('Pro user registration error:', err);
    return NextResponse.json(
      { status: 'error', message: err.message },
      { status: 500 }
    );
  }
} 