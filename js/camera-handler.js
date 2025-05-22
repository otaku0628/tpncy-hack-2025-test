// js/camera-handler.js
import { SCAN_INTERVAL, BATCH_INTERVAL, MAX_ATTEMPTS, DETECTOR_CONFIGS } from './constants.js';
import { validateDataMatrix, validateQRCode, extractGTIN, extractSerial } from './validators.js';
import { mockFilterGtinSerials } from '../mock/valid-codes.js';

let stream = null;
let scanTimeout = null;
let batchTimeout = null;
let detectedGtins = new Set();
let detectedCodes = new Set();
let batchAttempts = 0;

const detectors = {
    dataMatrix: null,
    qrCode: null,
    gtin: null,
    others: null
};

export async function initializeDetectors() {
    try {
        const formats = await BarcodeDetector.getSupportedFormats();
        console.log('Supported formats:', formats);

        detectors.dataMatrix = new BarcodeDetector(DETECTOR_CONFIGS.dataMatrix);
        detectors.qrCode = new BarcodeDetector(DETECTOR_CONFIGS.qrCode);
        detectors.gtin = new BarcodeDetector(DETECTOR_CONFIGS.gtin);
        detectors.others = new BarcodeDetector(DETECTOR_CONFIGS.others);
    } catch (error) {
        console.error('Error initializing detectors:', error);
    }
}

export async function startCamera() {
    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        const video = document.getElementById('video');
        video.srcObject = stream;
        await video.play();
        startDetection();
    } catch (error) {
        console.error('Error starting camera:', error);
    }
}

export function stopCamera() {
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
    }
    if (scanTimeout) clearTimeout(scanTimeout);
    if (batchTimeout) clearTimeout(batchTimeout);
    resetState();
}

function resetState() {
    detectedGtins.clear();
    detectedCodes.clear();
    batchAttempts = 0;
    updateUI();
}

function startDetection() {
    scanTimeout = setTimeout(detectCodes, SCAN_INTERVAL);
    batchTimeout = setTimeout(processBatch, BATCH_INTERVAL);
}

async function detectCodes() {
    const video = document.getElementById('video');
    try {
        const [dataMatrixCodes, qrCodes, gtinCodes, otherCodes] = await Promise.all([
            detectors.dataMatrix.detect(video),
            detectors.qrCode.detect(video),
            detectors.gtin.detect(video),
            detectors.others.detect(video)
        ]);

        processDetectedCodes([...dataMatrixCodes, ...qrCodes, ...gtinCodes, ...otherCodes]);
    } catch (error) {
        console.error('Error detecting codes:', error);
    }

    scanTimeout = setTimeout(detectCodes, SCAN_INTERVAL);
}

function processDetectedCodes(codes) {
    for (const code of codes) {
        let result = validateDataMatrix(code.rawValue);
        if (!result.isValid) {
            result = validateQRCode(code.rawValue);
        }

        if (result.isValid) {
            const gtin = extractGTIN(result.code);
            if (gtin) detectedGtins.add(gtin);
            detectedCodes.add(result.code);
        } else {
            detectedCodes.add(code.rawValue);
        }
    }

    updateUI();
}

async function processBatch() {
    if (detectedCodes.size === 0) {
        batchTimeout = setTimeout(processBatch, BATCH_INTERVAL);
        return;
    }

    const gtins = Array.from(detectedGtins);
    const serials = Array.from(detectedCodes).map(code => extractSerial(code) || code);

    let validCodeFound = false;
    for (const gtin of gtins) {
        const result = mockFilterGtinSerials(gtin, serials);
        if (result.gtinSerials.length > 0) {
            onTpncyCodeDetected(result.gtinSerials[0]);
            validCodeFound = true;
            break;
        }
    }

    if (!validCodeFound) {
        batchAttempts++;
        if (batchAttempts >= MAX_ATTEMPTS) {
            onDetectionTimeout(detectedGtins, detectedCodes);
        } else {
            updateUI();
            batchTimeout = setTimeout(processBatch, BATCH_INTERVAL);
        }
    }
}

function updateUI() {
    const currentBatchEl = document.getElementById('currentBatch');
    currentBatchEl.textContent = Array.from(detectedCodes).join(', ');

    for (let i = 1; i <= MAX_ATTEMPTS; i++) {
        const attemptEl = document.getElementById(`attempt${i}`);
        if (i <= batchAttempts) {
            attemptEl.textContent = `Attempt ${i}: No valid codes found`;
            attemptEl.classList.add('active');
        } else {
            attemptEl.textContent = '';
            attemptEl.classList.remove('active');
        }
    }
}

function onTpncyCodeDetected(code) {
    stopCamera();
    const actionButtons = document.getElementById('actionButtons');
    actionButtons.classList.add('visible');
    const redirectButton = document.getElementById('redirectButton');
    const redirectLink = document.getElementById('redirectLink');
    redirectButton.onclick = () => window.location.href = `/product/${encodeURIComponent(code)}`;
    redirectLink.href = `/product/${encodeURIComponent(code)}`;
    redirectLink.textContent = `/product/${code}`;
}

function onDetectionTimeout(gtins, unknownCodes) {
    stopCamera();
    const actionButtons = document.getElementById('actionButtons');
    actionButtons.classList.add('visible');
    const redirectButton = document.getElementById('redirectButton');
    const redirectLink = document.getElementById('redirectLink');

    if (gtins.size > 0) {
        console.log(`Redirect To GTIN Landing Page..., GTINs: ${Array.from(gtins)}`);
        redirectButton.onclick = () => window.location.href = '/gtin-landing';
        redirectLink.href = '/gtin-landing';
        redirectLink.textContent = 'GTIN Landing Page';
    } else {
        console.log(`Redirect To Timeout Page..., Codes: ${Array.from(unknownCodes)}`);
        redirectButton.onclick = () => window.location.href = '/timeout';
        redirectLink.href = '/timeout';
        redirectLink.textContent = 'Timeout Page';
    }
}

// Initialize detectors when the script loads
initializeDetectors();
