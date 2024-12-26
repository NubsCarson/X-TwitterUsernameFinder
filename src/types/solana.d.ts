import { PublicKey, Transaction } from '@solana/web3.js';

interface PhantomProvider {
  publicKey: { toString(): string };
  isPhantom?: boolean;
  signMessage(message: Uint8Array, encoding: string): Promise<{ signature: Uint8Array }>;
  connect(): Promise<{ publicKey: { toString(): string } }>;
  disconnect(): Promise<void>;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
    handlePayment?: () => Promise<void>;
  }
} 