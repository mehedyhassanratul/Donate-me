// Notification system
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 2000);
    }, 100);
}

// Copy to clipboard functionality
function copyToClipboard(button) {
    const addressElement = button.parentElement.querySelector('.crypto-address');
    const address = addressElement.dataset.address;
    
    navigator.clipboard.writeText(address).then(() => {
        const originalText = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i> Copied!';
        button.classList.add('copied');
        showNotification('Address copied to clipboard!', 'success');
        
        setTimeout(() => {
            button.innerHTML = originalText;
            button.classList.remove('copied');
        }, 2000);
    }).catch(err => {
        console.error('Failed to copy:', err);
        button.innerHTML = '<i class="fas fa-times"></i> Failed to copy';
        button.classList.add('error');
        showNotification('Failed to copy address', 'error');
        
        setTimeout(() => {
            button.innerHTML = '<i class="fas fa-copy"></i> Copy Address';
            button.classList.remove('error');
        }, 2000);
    });
}

// Wallet Connection Functions
let web3;
let userAccount;

// Update button state
function updateButtonState(button, state, message) {
    const originalText = button.textContent;
    button.innerHTML = message;
    
    if (state === 'loading') {
        button.disabled = true;
        button.classList.add('loading');
    } else if (state === 'connected') {
        button.disabled = false;
        button.classList.remove('loading');
        button.classList.add('connected');
    } else {
        button.disabled = false;
        button.classList.remove('loading', 'connected');
    }
    
    return originalText;
}

// Connect MetaMask
async function connectMetaMask() {
    const button = document.querySelector('.wallet-btn[onclick="connectMetaMask()"]');
    const originalText = updateButtonState(button, 'loading', '<i class="fas fa-spinner fa-spin"></i> Connecting...');
    
    try {
        // Check if MetaMask is installed
        if (typeof window.ethereum === 'undefined') {
            throw new Error('MetaMask is not installed');
        }

        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        
        // Initialize Web3
        web3 = new Web3(window.ethereum);
        
        // Get network ID
        const networkId = await web3.eth.net.getId();
        const networkName = getNetworkName(networkId);
        
        // Update button and show success message
        updateButtonState(button, 'connected', `<i class="fas fa-check"></i> Connected to ${networkName}`);
        updateFloatingWalletButton('connected');
        showNotification(`Successfully connected to MetaMask on ${networkName}`, 'success');
        
        // Setup event listeners
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
        
        showPaymentContainer();
        
    } catch (error) {
        console.error('MetaMask connection error:', error);
        updateButtonState(button, 'error', originalText);
        updateFloatingWalletButton('error');
        
        if (error.code === 4001) {
            showNotification('Please connect to MetaMask', 'error');
        } else if (error.message.includes('not installed')) {
            showNotification('Please install MetaMask', 'error');
            window.open('https://metamask.io/download.html', '_blank');
        } else {
            showNotification('Failed to connect to MetaMask', 'error');
        }
    }
}

// Connect TrustWallet
async function connectTrustWallet() {
    const button = document.querySelector('.wallet-btn[onclick="connectTrustWallet()"]');
    const originalText = updateButtonState(button, 'loading', '<i class="fas fa-spinner fa-spin"></i> Connecting...');
    
    try {
        // Check if TrustWallet is installed
        if (typeof window.ethereum === 'undefined' || !window.ethereum.isTrust) {
            throw new Error('TrustWallet is not installed');
        }

        // Request account access
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        userAccount = accounts[0];
        
        // Initialize Web3
        web3 = new Web3(window.ethereum);
        
        // Get network ID
        const networkId = await web3.eth.net.getId();
        const networkName = getNetworkName(networkId);
        
        // Update button and show success message
        updateButtonState(button, 'connected', `<i class="fas fa-check"></i> Connected to ${networkName}`);
        showNotification(`Successfully connected to TrustWallet on ${networkName}`, 'success');
        
        // Setup event listeners
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', handleChainChanged);
        
    } catch (error) {
        console.error('TrustWallet connection error:', error);
        updateButtonState(button, 'error', originalText);
        
        if (error.message.includes('not installed')) {
            showNotification('Please install TrustWallet', 'error');
            window.open('https://trustwallet.com/download', '_blank');
        } else {
            showNotification('Failed to connect to TrustWallet', 'error');
        }
    }
}

// Handle account changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // User disconnected
        userAccount = null;
        showNotification('Wallet disconnected', 'error');
        resetButtons();
        hidePaymentContainer();
        updateFloatingWalletButton('default');
    } else if (accounts[0] !== userAccount) {
        // User switched accounts
        userAccount = accounts[0];
        showNotification('Account changed: ' + shortenAddress(userAccount), 'success');
        showPaymentContainer();
        updateFloatingWalletButton('connected');
    }
}

// Handle network changes
function handleChainChanged(chainId) {
    window.location.reload();
}

// Get network name
function getNetworkName(networkId) {
    const networks = {
        1: 'Ethereum Mainnet',
        3: 'Ropsten Testnet',
        4: 'Rinkeby Testnet',
        5: 'Goerli Testnet',
        42: 'Kovan Testnet',
        56: 'BSC Mainnet',
        97: 'BSC Testnet',
        137: 'Polygon Mainnet',
        80001: 'Mumbai Testnet'
    };
    return networks[networkId] || 'Unknown Network';
}

// Reset wallet buttons
function resetButtons() {
    const buttons = document.querySelectorAll('.wallet-btn');
    buttons.forEach(button => {
        button.disabled = false;
        button.classList.remove('loading', 'connected', 'error');
        if (button.getAttribute('onclick').includes('MetaMask')) {
            button.innerHTML = '<i class="fas fa-wallet"></i> Connect MetaMask';
        } else if (button.getAttribute('onclick').includes('TrustWallet')) {
            button.innerHTML = '<i class="fas fa-wallet"></i> Connect TrustWallet';
        }
    });
}

// Helper function to shorten address
function shortenAddress(address) {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Contract addresses and ABIs
const CONTRACT_ADDRESSES = {
    BUSD: '0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56', // BUSD on BSC
    BTC_RECIPIENT: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh' // BTC address
};

const RECIPIENT_ADDRESSES = {
    ETH: '0x585298841595F28E599B2eBE5A60445a4A0cFF00',
    BUSD: '0x585298841595F28E599B2eBE5A60445a4A0cFF00',
    BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh'
};

// Required networks for each currency
const REQUIRED_NETWORKS = {
    ETH: '0x1', // Ethereum Mainnet
    BUSD: '0x38', // BSC Mainnet
    BTC: 'BTC'
};

const BUSD_ABI = [
    {
        "constant": false,
        "inputs": [
            {"name": "_to", "type": "address"},
            {"name": "_value", "type": "uint256"}
        ],
        "name": "transfer",
        "outputs": [{"name": "", "type": "bool"}],
        "payable": false,
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

// Show payment container when wallet is connected
function showPaymentContainer() {
    const container = document.getElementById('direct-payment-container');
    if (container) {
        container.style.display = 'block';
        updateNetworkInfo();
    }
}

// Hide payment container when wallet is disconnected
function hidePaymentContainer() {
    const container = document.getElementById('direct-payment-container');
    if (container) {
        container.style.display = 'none';
    }
}

// Update network info display
function updateNetworkInfo() {
    const networkSpan = document.getElementById('current-network');
    const messageSpan = document.getElementById('payment-message');
    const currency = document.getElementById('payment-currency').value;
    
    if (!web3 || !userAccount) {
        networkSpan.textContent = 'Not connected';
        messageSpan.textContent = 'Please connect your wallet to continue';
        return;
    }

    web3.eth.net.getId().then(networkId => {
        const networkName = getNetworkName(networkId);
        networkSpan.textContent = networkName;
        
        const requiredNetwork = REQUIRED_NETWORKS[currency];
        const currentNetwork = '0x' + networkId.toString(16);
        
        if (currency === 'BTC') {
            messageSpan.textContent = 'Please use a Bitcoin wallet for BTC transactions';
        } else if (currentNetwork !== requiredNetwork) {
            messageSpan.textContent = `Please switch to ${getNetworkName(parseInt(requiredNetwork, 16))} for ${currency} transactions`;
        } else {
            messageSpan.textContent = `Ready to send ${currency} on ${networkName}`;
        }
    });
}

// Handle payment
async function handlePayment() {
    const amountInput = document.getElementById('payment-amount');
    const currencySelect = document.getElementById('payment-currency');
    const button = document.getElementById('send-payment-btn');
    
    const amount = parseFloat(amountInput.value);
    const currency = currencySelect.value;

    if (!amount || amount <= 0) {
        showNotification('Please enter a valid amount', 'error');
        return;
    }

    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        // Check if wallet is connected
        if (!web3 || !userAccount) {
            throw new Error('Please connect your wallet first');
        }

        // Validate network
        const networkId = await web3.eth.net.getId();
        const currentNetwork = '0x' + networkId.toString(16);
        const requiredNetwork = REQUIRED_NETWORKS[currency];

        if (currency === 'BTC') {
            // For BTC, show QR code or copy address
            const btcAddress = RECIPIENT_ADDRESSES.BTC;
            showNotification(`Please send ${amount} BTC to ${btcAddress}`, 'info');
            // You might want to show a QR code here
            return;
        }

        if (currentNetwork !== requiredNetwork) {
            throw new Error(`Please switch to ${getNetworkName(parseInt(requiredNetwork, 16))} for ${currency} transactions`);
        }

        // Send payment based on currency
        switch (currency) {
            case 'ETH':
                await sendETHPayment(amount);
                break;
            case 'BUSD':
                await sendBUSDPayment(amount);
                break;
            default:
                throw new Error('Unsupported currency');
        }

        showNotification('Payment sent successfully!', 'success');
        amountInput.value = '';
    } catch (error) {
        console.error('Payment error:', error);
        showNotification(error.message || 'Payment failed', 'error');
    } finally {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-paper-plane"></i> Send Payment';
    }
}

// Send ETH payment
async function sendETHPayment(amount) {
    if (!web3 || !userAccount) {
        throw new Error('Wallet not connected');
    }

    const weiAmount = web3.utils.toWei(amount.toString(), 'ether');
    const recipientAddress = RECIPIENT_ADDRESSES.ETH;

    await web3.eth.sendTransaction({
        from: userAccount,
        to: recipientAddress,
        value: weiAmount
    });
}

// Send BUSD payment
async function sendBUSDPayment(amount) {
    if (!web3 || !userAccount) {
        throw new Error('Wallet not connected');
    }

    const busdContract = new web3.eth.Contract(BUSD_ABI, CONTRACT_ADDRESSES.BUSD);
    const weiAmount = web3.utils.toWei(amount.toString(), 'ether');
    const recipientAddress = RECIPIENT_ADDRESSES.BUSD;

    await busdContract.methods.transfer(recipientAddress, weiAmount).send({
        from: userAccount
    });
}

// Floating wallet button functionality
let lastScrollPosition = 0;
const floatingWallet = document.getElementById('floating-wallet');

// Show/hide floating wallet based on scroll
window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    const donateSection = document.getElementById('donate');
    const donateSectionTop = donateSection.offsetTop;
    const donateSectionBottom = donateSectionTop + donateSection.offsetHeight;
    
    // Hide when in donate section
    if (currentScroll >= donateSectionTop - 100 && currentScroll <= donateSectionBottom) {
        floatingWallet.classList.add('hidden');
    } else {
        floatingWallet.classList.remove('hidden');
    }
    
    // Hide when scrolling up
    if (currentScroll < lastScrollPosition && currentScroll > 200) {
        floatingWallet.style.transform = 'translateY(0)';
    } else if (currentScroll > lastScrollPosition) {
        floatingWallet.style.transform = 'translateY(100px)';
    }
    
    lastScrollPosition = currentScroll;
});

// Update floating wallet button state
function updateFloatingWalletButton(state, message) {
    const floatingBtn = document.querySelector('.floating-wallet-btn');
    const walletText = floatingBtn.querySelector('.wallet-text');
    
    floatingBtn.className = 'floating-wallet-btn';
    
    switch(state) {
        case 'connected':
            floatingBtn.classList.add('connected');
            walletText.textContent = shortenAddress(userAccount);
            break;
        case 'error':
            floatingBtn.classList.add('error');
            walletText.textContent = 'Connection Failed';
            setTimeout(() => {
                floatingBtn.classList.remove('error');
                walletText.textContent = 'Connect Wallet';
            }, 3000);
            break;
        default:
            walletText.textContent = 'Connect Wallet';
    }
}

// QR Code functionality
function generateQRCodes() {
    const cryptoAddresses = {
        'btc': 'bc1qvd5hjc0m6y5u3vgyhgrw8xtdm7hp9r97xe9mwh',
        'eth': '0x585298841595F28E599B2eBE5A60445a4A0cFF00',
        'busd': '0x585298841595F28E599B2eBE5A60445a4A0cFF00'
    };

    Object.entries(cryptoAddresses).forEach(([coin, address]) => {
        const container = document.querySelector(`.${coin}-card .qr-code`);
        if (container) {
            QRCode.toCanvas(container, address, {
                width: 200,
                height: 200,
                margin: 2,
                color: {
                    dark: '#4a4a4a',
                    light: '#ffffff'
                }
            }, function(error) {
                if (error) console.error('Error generating QR code:', error);
            });
        }
    });
}

// Toggle QR code visibility
function toggleQR(button) {
    const card = button.closest('.crypto-card');
    const qrCode = card.querySelector('.qr-code');
    const overlay = card.querySelector('.qr-overlay');
    const isVisible = qrCode.classList.toggle('visible');
    
    // Toggle overlay
    overlay.classList.toggle('hidden', isVisible);
    
    // Update button text and state
    button.innerHTML = isVisible ? 
        '<i class="fas fa-times"></i> Hide QR' : 
        '<i class="fas fa-qrcode"></i> Show QR';
    button.classList.toggle('active', isVisible);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    generateQRCodes();
    
    // Add click handlers for copy buttons
    document.querySelectorAll('.copy-btn').forEach(button => {
        button.addEventListener('click', () => copyToClipboard(button));
    });
    
    // Initialize payment button
    const paymentBtn = document.getElementById('send-payment-btn');
    if (paymentBtn) {
        paymentBtn.addEventListener('click', handlePayment);
    }
    
    const currencySelect = document.getElementById('payment-currency');
    if (currencySelect) {
        currencySelect.addEventListener('change', updateNetworkInfo);
    }
});

// Add styles dynamically
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 2rem;
        border-radius: 8px;
        background: var(--surface);
        color: var(--text);
        box-shadow: var(--shadow-lg);
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
    }
    
    .notification-content {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }
    
    .notification.success i {
        color: #4CAF50;
    }
    
    .notification.error i {
        color: #f44336;
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .wallet-btn.loading {
        opacity: 0.7;
        cursor: wait;
    }
    
    .wallet-btn.connected {
        background: var(--accent);
        color: var(--background);
    }
    
    .wallet-btn.connected img {
        filter: brightness(0) invert(1);
    }
`;
document.head.appendChild(style);
