// Smart QR Code Generator for Paw App
const form = document.getElementById('qr-form');
const typeSelect = document.getElementById('type');
const inputFields = document.getElementById('input-fields');
const qrCodeDiv = document.getElementById('qrcode');
const downloadBtn = document.getElementById('download-btn');
const shareBtn = document.getElementById('share-btn');
const themeToggle = document.getElementById('theme-toggle');

const copyBtn = document.getElementById('copy-btn');
const historyList = document.getElementById('history-list');

let qr;
let currentData = '';

let qrHistory = JSON.parse(localStorage.getItem('paw-qr-history') || '[]');

const fieldTemplates = {
    url: `<label for="url">URL:</label><input type="url" id="url" name="url" placeholder="https://paw.app" required>`,
    text: `<label for="text">Text:</label><input type="text" id="text" name="text" placeholder="Enter any text" required>`,
    wifi: `<label for="ssid">WiFi SSID:</label><input type="text" id="ssid" name="ssid" placeholder="Network name" required><label for="password">Password:</label><input type="text" id="password" name="password" placeholder="Password"><label for="encryption">Encryption:</label><select id="encryption" name="encryption"><option value="WPA">WPA/WPA2</option><option value="WEP">WEP</option><option value="nopass">None</option></select>`,
    contact: `<label for="name">Name:</label><input type="text" id="name" name="name" placeholder="Full name" required><label for="phone">Phone:</label><input type="tel" id="phone" name="phone" placeholder="Phone"><label for="email">Email:</label><input type="email" id="email" name="email" placeholder="Email">`
};

function updateFields() {
    inputFields.innerHTML = fieldTemplates[typeSelect.value];
}

function getQRData() {
    switch (typeSelect.value) {
        case 'url':
            return document.getElementById('url').value;
        case 'text':
            return document.getElementById('text').value;
        case 'wifi':
            const ssid = document.getElementById('ssid').value;
            const password = document.getElementById('password').value;
            const enc = document.getElementById('encryption').value;
            return `WIFI:T:${enc};S:${ssid};P:${password};;`;
        case 'contact':
            const name = document.getElementById('name').value;
            const phone = document.getElementById('phone').value;
            const email = document.getElementById('email').value;
            return `MECARD:N:${name};TEL:${phone};EMAIL:${email};;`;
        default:
            return '';
    }
}

function generateQR(data) {
    qrCodeDiv.innerHTML = '';
    qr = new QRCode(qrCodeDiv, {
        text: data,
        width: 180,
        height: 180,
        colorDark: "#222",
        colorLight: "#fff",
        correctLevel: QRCode.CorrectLevel.H
    });

    // Haptic feedback for iOS
    if (window.navigator.vibrate) {
        window.navigator.vibrate(50);
    }

    // Add to history
    if (data && (!qrHistory.length || qrHistory[0] !== data)) {
        qrHistory.unshift(data);
        if (qrHistory.length > 5) qrHistory = qrHistory.slice(0, 5);
        localStorage.setItem('paw-qr-history', JSON.stringify(qrHistory));
        renderHistory();
    }
}

form.addEventListener('input', () => {
    const data = getQRData();
    currentData = data;
    if (data) generateQR(data);
});

form.addEventListener('submit', e => {
    e.preventDefault();
    const data = getQRData();
    currentData = data;
    if (data) generateQR(data);
});

typeSelect.addEventListener('change', () => {
    updateFields();
    setTimeout(() => {
        form.dispatchEvent(new Event('input'));
    }, 100);
});

updateFields();

// Download QR code as PNG
function downloadQR() {
    const img = qrCodeDiv.querySelector('img') || qrCodeDiv.querySelector('canvas');
    if (!img) return;
    let url;
    if (img.tagName === 'IMG') {
        url = img.src;
    } else {
        url = img.toDataURL();
    }
    const a = document.createElement('a');
    a.href = url;
    a.download = 'paw-qr-code.png';
    a.click();
}
downloadBtn.addEventListener('click', downloadQR);

// Share QR code (Web Share API)
shareBtn.addEventListener('click', async () => {
    const img = qrCodeDiv.querySelector('img') || qrCodeDiv.querySelector('canvas');
    if (!img || !navigator.canShare) {
        alert('Sharing not supported on this device/browser.');
        return;
    }
    let blob;
    if (img.tagName === 'IMG') {
        const res = await fetch(img.src);
        blob = await res.blob();
    } else {
        const dataUrl = img.toDataURL();
        const res = await fetch(dataUrl);
        blob = await res.blob();
    }
    const file = new File([blob], 'paw-qr-code.png', { type: blob.type });
    try {
        await navigator.share({
            files: [file],
            title: 'Paw QR Code',
            text: 'Here is your QR code!'
        });
    } catch (err) {
        alert('Share failed: ' + err);
    }
});

// Theme toggle
function setTheme(dark) {
    document.body.classList.toggle('dark', dark);
    themeToggle.textContent = dark ? '☀️' : '🌙';
}

// Copy QR data to clipboard
copyBtn.addEventListener('click', async () => {
    if (!currentData) return;
    try {
        await navigator.clipboard.writeText(currentData);
        copyBtn.textContent = 'Copied!';
        setTimeout(() => copyBtn.textContent = 'Copy', 1200);
    } catch {
        alert('Copy failed');
    }
});

// Render QR history
function renderHistory() {
    historyList.innerHTML = '';
    qrHistory.forEach((item, idx) => {
        const li = document.createElement('li');
        li.textContent = item.length > 40 ? item.slice(0, 40) + '...' : item;
        li.title = item;
        li.tabIndex = 0;
        li.setAttribute('role', 'button');
        li.addEventListener('click', () => {
            generateQR(item);
            currentData = item;
        });
        historyList.appendChild(li);
    });
}

renderHistory();
themeToggle.addEventListener('click', () => {
    const isDark = !document.body.classList.contains('dark');
    setTheme(isDark);
    localStorage.setItem('paw-qr-theme', isDark ? 'dark' : 'light');
});
// Load theme
setTheme(localStorage.getItem('paw-qr-theme') === 'dark');
