export interface PhantomProvider {
  publicKey: { toString: () => string } | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signMessage: (message: Uint8Array) => Promise<{ signature: Uint8Array }>;
  connected: boolean;
  isPhantom?: boolean;
}

declare global {
  interface Window {
    solana?: PhantomProvider;
  }
} 