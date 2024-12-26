'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

export default function WalletButton() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if wallet was previously connected and pro status
    const storedProStatus = localStorage.getItem('isProUser');
    const storedWalletAddress = localStorage.getItem('walletAddress');
    
    if (window.solana?.connected && storedProStatus === 'true' && storedWalletAddress === window.solana.publicKey?.toString()) {
      setWalletConnected(true);
      setIsProUser(true);
      setPublicKey(window.solana.publicKey.toString());
    }
  }, []);

  const connectWallet = async () => {
    try {
      setLoading(true);
      if (!window.solana) {
        alert('Please install Phantom wallet');
        return;
      }

      await window.solana.connect();
      const publicKey = window.solana.publicKey?.toString();
      
      if (!publicKey) {
        throw new Error('Failed to get public key');
      }

      // Generate and sign message
      const message = new TextEncoder().encode(`Verify wallet ownership: ${Date.now()}`);
      const signedMessage = await window.solana.signMessage(message);
      const signature = Buffer.from(signedMessage.signature).toString('base64');

      // Verify signature
      const response = await fetch('/api/verify-wallet', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet_address: publicKey,
          signature,
          message: Buffer.from(message).toString('base64')
        })
      });

      const data = await response.json();
      
      if (data.status === 'success') {
        setWalletConnected(true);
        setPublicKey(publicKey);
        setIsProUser(data.is_pro || false);
        localStorage.setItem('walletAddress', publicKey);
        localStorage.setItem('isProUser', String(data.is_pro || false));
      } else {
        throw new Error(data.message || 'Failed to verify wallet');
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert('Failed to connect wallet. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.solana) {
        await window.solana.disconnect();
        setWalletConnected(false);
        setPublicKey('');
        setIsProUser(false);
        localStorage.removeItem('walletAddress');
        localStorage.removeItem('isProUser');
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  return (
    <Button
      onClick={walletConnected ? disconnectWallet : connectWallet}
      disabled={loading}
      className="w-full"
    >
      {loading ? 'Connecting...' : walletConnected ? `Connected: ${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : 'Connect Wallet'}
    </Button>
  );
} 