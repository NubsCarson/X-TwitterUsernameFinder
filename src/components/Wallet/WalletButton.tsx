'use client';

import React, { useState, useEffect } from 'react';
import { Connection, PublicKey, LAMPORTS_PER_SOL, Transaction, SystemProgram } from '@solana/web3.js';

const PAYMENT_AMOUNT = 0.1; // SOL
const RECIPIENT_ADDRESS = '3cGdQrByDGxAweqbngWrmV5gU7Z6K1U3p2TLpx9nQw6d';
const AUTH_MESSAGE = "Sign this message to verify your wallet ownership for Twitter Handle Checker Pro access.";
const DEFAULT_RPC = "https://api.mainnet-beta.solana.com"; // Fallback RPC

export default function WalletButton() {
  const [walletConnected, setWalletConnected] = useState(false);
  const [isProUser, setIsProUser] = useState(false);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [rpcEndpoint, setRpcEndpoint] = useState<string>(DEFAULT_RPC);

  useEffect(() => {
    // Fetch configuration from server
    fetch('/api/config')
      .then(response => response.json())
      .then(config => {
        if (config.rpc_endpoint) {
          console.log('Using RPC endpoint:', config.rpc_endpoint);
          setRpcEndpoint(config.rpc_endpoint);
        } else {
          console.log('Using default RPC endpoint:', DEFAULT_RPC);
        }
      })
      .catch(error => {
        console.error('Error loading configuration:', error);
        console.log('Falling back to default RPC endpoint:', DEFAULT_RPC);
      });

    // Check for stored pro status
    const storedProStatus = localStorage.getItem('proStatus');
    const storedWalletAddress = localStorage.getItem('walletAddress');
    
    if (window.solana?.isConnected && storedProStatus === 'true' && storedWalletAddress === window.solana.publicKey?.toString()) {
      setWalletConnected(true);
      setIsProUser(true);
      setPublicKey(window.solana.publicKey.toString());
    }
  }, []);

  const verifyWalletOwnership = async (publicKey: PublicKey) => {
    try {
      const encodedMessage = new TextEncoder().encode(AUTH_MESSAGE);
      const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");
      
      // Convert Uint8Array to base64 string
      const signature = btoa(Array.from(signedMessage.signature, byte => 
        String.fromCharCode(byte)).join(''));
      
      const response = await fetch('/api/verify-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wallet_address: publicKey.toString(),
          signature: signature,
          message: AUTH_MESSAGE
        })
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setIsProUser(data.is_pro);
        if (data.is_pro) {
          // Store pro status in localStorage
          localStorage.setItem('proStatus', 'true');
          localStorage.setItem('walletAddress', window.solana.publicKey.toString());
          // Trigger storage event for other components
          window.dispatchEvent(new Event('storage'));
        }
      }
      return data;
    } catch (err) {
      console.error('Error verifying wallet:', err);
      throw err;
    }
  };

  const registerProUser = async (publicKey: PublicKey) => {
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
      try {
        const encodedMessage = new TextEncoder().encode(AUTH_MESSAGE);
        const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");
        
        const signature = btoa(Array.from(signedMessage.signature, byte => 
          String.fromCharCode(byte)).join(''));
        
        const response = await fetch('/api/add-pro-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            wallet_address: publicKey.toString(),
            signature: signature,
            message: AUTH_MESSAGE
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to register pro user');
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
          setIsProUser(true);
          // Store pro status in localStorage
          localStorage.setItem('proStatus', 'true');
          localStorage.setItem('walletAddress', window.solana.publicKey.toString());
          // Trigger storage event for other components
          window.dispatchEvent(new Event('storage'));
          return data;
        } else {
          throw new Error(data.message || 'Failed to register pro user');
        }
      } catch (err) {
        retries++;
        if (retries === maxRetries) {
          throw new Error('Failed to register pro user after multiple attempts: ' + err.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  };

  const handlePayment = async () => {
    let processingPopup = null;
    try {
      if (!walletConnected || !rpcEndpoint) {
        alert('Please connect your wallet first');
        return;
      }

      // Create and show processing popup
      const overlay = document.createElement('div');
      overlay.className = 'payment-popup-overlay';
      
      const popup = document.createElement('div');
      popup.className = 'payment-popup';
      popup.innerHTML = `
        <div class="spinner"></div>
        <h3>Processing Payment</h3>
        <p>Please wait while we process your payment. This can take up to 30 seconds.</p>
        <div class="progress-bar-container">
          <div class="progress-bar-fill"></div>
        </div>
        <p class="status-text">Confirming transaction...</p>
      `;
      
      document.body.appendChild(overlay);
      document.body.appendChild(popup);
      
      processingPopup = {
        updateStatus: (text: string) => {
          const statusEl = popup.querySelector('.status-text');
          if (statusEl) statusEl.textContent = text;
        },
        close: () => {
          overlay.remove();
          popup.remove();
        }
      };

      const connection = new Connection(rpcEndpoint, {
        commitment: 'confirmed',
        confirmTransactionInitialTimeout: 30000
      });

      const transaction = new Transaction();
      
      const instruction = SystemProgram.transfer({
        fromPubkey: window.solana.publicKey,
        toPubkey: new PublicKey(RECIPIENT_ADDRESS),
        lamports: PAYMENT_AMOUNT * LAMPORTS_PER_SOL
      });

      transaction.add(instruction);
      transaction.feePayer = window.solana.publicKey;
      
      try {
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        transaction.recentBlockhash = blockhash;
        
        processingPopup.updateStatus('Please approve the transaction in your wallet...');
        const signedTx = await window.solana.signAndSendTransaction(transaction);
        const signature = signedTx.signature;
        
        processingPopup.updateStatus('Transaction sent, waiting for confirmation...');
        
        let confirmed = false;
        let retries = 0;
        const maxRetries = 15;
        
        while (!confirmed && retries < maxRetries) {
          try {
            const confirmation = await connection.confirmTransaction(signature, 'confirmed');
            if (confirmation.value.err === null) {
              confirmed = true;
              break;
            }
          } catch (error) {
            console.log('Waiting for confirmation...', error);
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
          retries++;
        }
        
        if (!confirmed) {
          const status = await connection.getSignatureStatus(signature);
          if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
            confirmed = true;
          }
        }
        
        if (!confirmed) {
          processingPopup.close();
          throw new Error('Transaction confirmation timeout');
        }
        
        processingPopup.updateStatus('Transaction confirmed, registering pro access...');
        
        try {
          const regResult = await registerProUser(window.solana.publicKey);
          
          if (regResult.status === 'success') {
            processingPopup.close();
            alert('Payment successful! Pro features unlocked.');
          } else {
            throw new Error(regResult.message || 'Registration failed');
          }
        } catch (regError) {
          processingPopup.close();
          console.error('Failed to register pro user:', regError);
          alert('Payment successful, but pro registration failed. Please try reconnecting your wallet.');
        }
      } catch (error) {
        processingPopup.close();
        console.error('Transaction failed:', error);
        alert('Transaction failed. Please check your wallet balance and try again.');
      }
    } catch (err) {
      if (processingPopup) {
        processingPopup.close();
      }
      console.error('Payment process failed:', err);
      alert(`Payment failed: ${err.message}. Please try again.`);
    }
  };

  const connectWallet = async () => {
    try {
      if (!window.solana || !window.solana.isPhantom) {
        alert('Phantom wallet is not installed. Please install it from https://phantom.app/');
        return;
      }

      const resp = await window.solana.connect();
      setWalletConnected(true);
      setPublicKey(resp.publicKey.toString());
      
      // Verify wallet and check pro status
      const verificationResult = await verifyWalletOwnership(resp.publicKey);
      if (!verificationResult.is_pro) {
        // Trigger storage event to update other components
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error('Error connecting to Phantom wallet:', err);
      alert('Failed to connect to Phantom wallet. Please try again.');
    }
  };

  const disconnectWallet = async () => {
    try {
      if (window.solana) {
        await window.solana.disconnect();
        setWalletConnected(false);
        setPublicKey(null);
        setIsProUser(false);
        localStorage.removeItem('proStatus');
        localStorage.removeItem('walletAddress');
        // Trigger storage event to update other components
        window.dispatchEvent(new Event('storage'));
      }
    } catch (err) {
      console.error('Error disconnecting wallet:', err);
      alert('Failed to disconnect wallet. Please try again.');
    }
  };

  // Make handlePayment available globally for the payment button
  if (typeof window !== 'undefined') {
    window.handlePayment = handlePayment;
  }

  return (
    <button className="wallet-button" onClick={walletConnected ? disconnectWallet : connectWallet}>
      {walletConnected ? `Connected: ${publicKey?.slice(0, 4)}...${publicKey?.slice(-4)}` : 'Connect Wallet'}
    </button>
  );
} 