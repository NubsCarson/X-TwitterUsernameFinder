// Phantom Wallet Integration
let walletConnected = false;
let isProUser = false;
const PAYMENT_AMOUNT = 0.1; // SOL
const RECIPIENT_ADDRESS = '3cGdQrByDGxAweqbngWrmV5gU7Z6K1U3p2TLpx9nQw6d';

// Get configuration from server-side environment
let RPC_ENDPOINT;

// Fetch configuration from server
fetch('/config')
    .then(response => response.json())
    .then(config => {
        // Ensure RPC endpoint starts with https:// if not already present
        RPC_ENDPOINT = config.rpc_endpoint;
        if (RPC_ENDPOINT && !RPC_ENDPOINT.startsWith('http')) {
            RPC_ENDPOINT = `https://${RPC_ENDPOINT}`;
        }
        console.log('Loaded RPC endpoint:', RPC_ENDPOINT);
    })
    .catch(error => {
        console.error('Error loading configuration:', error);
        alert('Failed to load RPC configuration. Please refresh the page.');
    });

const AUTH_MESSAGE = "Sign this message to verify your wallet ownership for Twitter Handle Checker Pro access.";

async function verifyWalletOwnership(publicKey) {
    try {
        const encodedMessage = new TextEncoder().encode(AUTH_MESSAGE);
        const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");
        
        // Convert Uint8Array to base64 string
        const signature = btoa(Array.from(signedMessage.signature, byte => 
            String.fromCharCode(byte)).join(''));
        
        console.log('Verifying wallet ownership:', {
            wallet: publicKey.toString(),
            messageLength: AUTH_MESSAGE.length,
            signatureLength: signedMessage.signature.length,
            encodedSignatureLength: signature.length,
            publicKeyLength: publicKey.toBytes().length
        });
        
        const response = await fetch('/verify-wallet', {
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
        console.log('Verification response:', data);
        
        if (data.status === 'success') {
            isProUser = data.is_pro;
            if (isProUser) {
                unlockProFeatures();
            }
        }
        return data;
    } catch (err) {
        console.error('Error verifying wallet:', err);
        throw err;
    }
}

async function registerProUser(publicKey) {
    let retries = 0;
    const maxRetries = 3;
    
    while (retries < maxRetries) {
        try {
            const encodedMessage = new TextEncoder().encode(AUTH_MESSAGE);
            const signedMessage = await window.solana.signMessage(encodedMessage, "utf8");
            
            // Convert Uint8Array to base64 string
            const signature = btoa(Array.from(signedMessage.signature, byte => 
                String.fromCharCode(byte)).join(''));
            
            console.log('Registering pro user (attempt ' + (retries + 1) + '):', {
                wallet: publicKey.toString(),
                messageLength: AUTH_MESSAGE.length,
                signatureLength: signedMessage.signature.length,
                encodedSignatureLength: signature.length,
                publicKeyLength: publicKey.toBytes().length
            });
            
            const response = await fetch('/add-pro-user', {
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
                console.error('Registration failed:', errorData);
                throw new Error(errorData.message || 'Failed to register pro user');
            }
            
            const data = await response.json();
            console.log('Registration response:', data);
            
            if (data.status === 'success') {
                isProUser = true;
                unlockProFeatures();
                return data;
            } else {
                throw new Error(data.message || 'Failed to register pro user');
            }
        } catch (err) {
            console.error('Error registering pro user (attempt ' + (retries + 1) + '):', err);
            retries++;
            if (retries === maxRetries) {
                throw new Error('Failed to register pro user after multiple attempts: ' + err.message);
            }
            // Wait before retrying
            await new Promise(resolve => setTimeout(resolve, 1000));
        }
    }
}

function unlockProFeatures() {
    document.getElementById('rare-finder').classList.add('unlocked');
    const premiumLock = document.querySelector('.premium-lock');
    if (premiumLock) {
        premiumLock.innerHTML = `
            <h3>✨ Pro Features Unlocked</h3>
            <p>Welcome to the Rare Username Finder</p>
            <p class="text-muted">Find ultra-rare usernames using advanced patterns and algorithms</p>
        `;
    }
    
    // Store pro status in localStorage
    try {
        localStorage.setItem('proStatus', 'true');
        localStorage.setItem('walletAddress', window.solana.publicKey.toString());
    } catch (e) {
        console.error('Failed to store pro status:', e);
    }

    // Set up rare finder form handler
    if (window.setupRareFinder) {
        window.setupRareFinder();
    } else {
        console.error('Rare finder setup function not found');
    }
}

async function connectWallet() {
    try {
        if (!window.solana || !window.solana.isPhantom) {
            alert('Phantom wallet is not installed. Please install it from https://phantom.app/');
            return;
        }

        const resp = await window.solana.connect();
        walletConnected = true;
        
        // Update button text
        const walletBtn = document.getElementById('wallet-btn');
        walletBtn.textContent = `Connected: ${resp.publicKey.toString().slice(0, 4)}...${resp.publicKey.toString().slice(-4)}`;
        
        // Verify wallet and check pro status
        const verificationResult = await verifyWalletOwnership(resp.publicKey);
        if (!verificationResult.is_pro) {
            showPaymentButton();
        }
    } catch (err) {
        console.error('Error connecting to Phantom wallet:', err);
        alert('Failed to connect to Phantom wallet. Please try again.');
    }
}

function showPaymentButton() {
    const premiumLock = document.querySelector('.premium-lock');
    premiumLock.innerHTML = `
        <h3>🔒 Premium Feature</h3>
        <p>Access the Rare Username Finder</p>
        <p class="text-muted mb-4">Find ultra-rare usernames using advanced patterns and algorithms</p>
        <button class="btn btn-primary pay-button" onclick="handlePayment()">
            Pay ${PAYMENT_AMOUNT} SOL
        </button>
    `;
}

function showPaymentProcessingPopup() {
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
    
    return {
        updateStatus: (text) => {
            popup.querySelector('.status-text').textContent = text;
        },
        close: () => {
            overlay.remove();
            popup.remove();
        }
    };
}

async function handlePayment() {
    let processingPopup = null;
    try {
        if (!walletConnected) {
            alert('Please connect your wallet first');
            return;
        }

        if (!RPC_ENDPOINT) {
            throw new Error('RPC endpoint not configured. Please refresh the page.');
        }

        // Show loading state
        const payButton = document.querySelector('.pay-button');
        const originalText = payButton.textContent;
        payButton.textContent = 'Processing Payment...';
        payButton.disabled = true;

        // Show processing popup
        processingPopup = showPaymentProcessingPopup();

        console.log('Connecting to RPC:', RPC_ENDPOINT);
        const connection = new solanaWeb3.Connection(RPC_ENDPOINT, {
            commitment: 'confirmed',
            confirmTransactionInitialTimeout: 30000
        });

        const transaction = new solanaWeb3.Transaction();
        
        const instruction = solanaWeb3.SystemProgram.transfer({
            fromPubkey: window.solana.publicKey,
            toPubkey: new solanaWeb3.PublicKey(RECIPIENT_ADDRESS),
            lamports: PAYMENT_AMOUNT * solanaWeb3.LAMPORTS_PER_SOL
        });

        transaction.add(instruction);
        transaction.feePayer = window.solana.publicKey;
        
        try {
            const { blockhash } = await connection.getLatestBlockhash('confirmed');
            transaction.recentBlockhash = blockhash;
            
            processingPopup.updateStatus('Please approve the transaction in your wallet...');
            const signedTx = await window.solana.signAndSendTransaction(transaction);
            const signature = signedTx.signature;
            console.log('Transaction sent:', signature);
            
            processingPopup.updateStatus('Transaction sent, waiting for confirmation...');
            
            // Wait for confirmation with shorter timeout
            let confirmed = false;
            let retries = 0;
            const maxRetries = 15; // 15 seconds timeout (reduced from 30)
            
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
                // Even if we timeout, check the transaction status one more time
                try {
                    const status = await connection.getSignatureStatus(signature);
                    if (status.value?.confirmationStatus === 'confirmed' || status.value?.confirmationStatus === 'finalized') {
                        confirmed = true;
                    }
                } catch (error) {
                    console.error('Failed to get final transaction status:', error);
                }
            }
            
            if (!confirmed) {
                processingPopup.close();
                throw new Error('Transaction confirmation timeout');
            }
            
            console.log('Transaction confirmed, proceeding to register pro user');
            processingPopup.updateStatus('Transaction confirmed, registering pro access...');
            
            try {
                // Register as pro user after successful payment
                const regResult = await registerProUser(window.solana.publicKey);
                console.log('Pro registration result:', regResult);
                
                if (regResult.status === 'success') {
                    console.log('Successfully registered as pro user');
                    processingPopup.close();
                    unlockProFeatures();
                    alert('Payment successful! Pro features unlocked.');
                } else {
                    throw new Error(regResult.message || 'Registration failed');
                }
            } catch (regError) {
                processingPopup.close();
                console.error('Failed to register pro user:', regError);
                alert('Payment successful, but pro registration failed. Please try reconnecting your wallet.');
                payButton.textContent = originalText;
                payButton.disabled = false;
            }
        } catch (error) {
            processingPopup.close();
            console.error('Transaction failed:', error);
            const payButton = document.querySelector('.pay-button');
            if (payButton) {
                payButton.textContent = 'Retry Payment';
                payButton.disabled = false;
            }
            alert('Transaction failed. Please check your wallet balance and try again.');
        }
    } catch (err) {
        if (processingPopup) {
            processingPopup.close();
        }
        console.error('Payment process failed:', err);
        const payButton = document.querySelector('.pay-button');
        if (payButton) {
            payButton.textContent = 'Retry Payment';
            payButton.disabled = false;
        }
        alert(`Payment failed: ${err.message}. Please try again.`);
    }
}

// Initialize wallet connection when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const walletBtn = document.getElementById('wallet-btn');
    walletBtn.addEventListener('click', connectWallet);
    
    // Check for stored pro status
    const storedProStatus = localStorage.getItem('proStatus');
    const storedWalletAddress = localStorage.getItem('walletAddress');
    
    // Auto-connect if wallet was previously connected
    if (window.solana && window.solana.isConnected) {
        connectWallet().then(() => {
            // If we have stored pro status and the wallet matches
            if (storedProStatus === 'true' && storedWalletAddress === window.solana.publicKey.toString()) {
                console.log('Restoring pro status from storage');
                isProUser = true;
                unlockProFeatures();
            }
        }).catch(err => {
            console.error('Error auto-connecting wallet:', err);
        });
    }
}); 