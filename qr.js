// QR Code functionality
function generateQRCode() {
    const addresses = {
        'Bitcoin (BTC)': 'bc1qvd5hjc0m6y5u3vgyhgrw8xtdm7hp9r97xe9mwh',
        'Ethereum (ETH)': '0x585298841595F28E599B2eBE5A60445a4A0cFF00',
        'BUSD (BNB Chain)': '0x585298841595F28E599B2eBE5A60445a4A0cFF00'
    };

    // Find all crypto cards
    document.querySelectorAll('.crypto-card').forEach(card => {
        const title = card.querySelector('.crypto-info h3').textContent;
        const address = addresses[title];
        const qrContainer = card.querySelector('.qr-code');
        
        if (address && qrContainer) {
            // Clear any existing content
            qrContainer.innerHTML = '';
            
            // Generate new QR code
            new QRCode(qrContainer, {
                text: address,
                width: 180,
                height: 180,
                colorDark: '#ff5252',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    });
}

// Toggle QR code visibility
function toggleQR(button) {
    const card = button.closest('.crypto-card');
    const qrContainer = card.querySelector('.qr-container');
    const qrOverlay = card.querySelector('.qr-overlay');
    
    // Toggle visibility
    if (qrContainer) qrContainer.classList.toggle('visible');
    if (qrOverlay) qrOverlay.classList.toggle('hidden');
    
    const isVisible = qrContainer.classList.contains('visible');
    
    // Update button text and style
    button.innerHTML = isVisible ? 
        '<i class="fas fa-times"></i> Hide QR' : 
        '<i class="fas fa-qrcode"></i> Show QR';
    
    // Toggle active state
    button.classList.toggle('active', isVisible);
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Load QR Code library
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/qrcode@1.5.3/lib/qrcode.min.js';
    script.onload = generateQRCode;
    document.head.appendChild(script);
});
