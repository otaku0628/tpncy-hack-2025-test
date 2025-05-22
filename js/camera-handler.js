// js/camera-handler.js
import { SCAN_INTERVAL, BATCH_INTERVAL, MAX_ATTEMPTS, DETECTOR_CONFIGS } from './constants.js';
import { validateDataMatrix, validateQRCode } from './validators.js';
import { mockFilterGtinSerials } from '../mock/valid-codes.js';

let stream = null;
let scanTimeout = null;
let batchTimeout = null;
let detectedGtins = new Set();
let detectedCodes = new Set();
let batchAttempts = 0;

// Initialize detectors as null
let detectors = {
    dataMatrix: null,
    qrCode: null,
    gtin: null,
    others: null
};

// Initialize detectors before using them
async function initializeDetectors() {
    try {
        detectors = {
            dataMatrix: new BarcodeDetector(DETECTOR_CONFIGS.dataMatrix),
            qrCode: new BarcodeDetector(DETECTOR_CONFIGS.qrCode),
            gtin: new BarcodeDetector(DETECTOR_CONFIGS.gtin),
            others: new BarcodeDetector(DETECTOR_CONFIGS.others)
        };
        return true;
    } catch (error) {
        console.error('Error initializing detectors:', error);
        return false;
    }
}

function resetState() {
    if (scanTimeout) clearTimeout(scanTimeout);
    if (batchTimeout) clearTimeout(batchTimeout);
    if (stream) {
        stream.getTracks().forEach(track => track.stop());
        stream = null;
    }
    detectedGtins.clear();
    detectedCodes.clear();
    batchAttempts = 0;
}

export async function startCamera() {
    try {
        // Initialize detectors first
        const initialized = await initializeDetectors();
        if (!initialized) {
            throw new Error('Failed to initialize barcode detectors');
        }

        stream = await navigator.mediaDevices.getUserMedia({ 
            video: { facingMode: 'environment' } 
        });
        
        const video = document.getElementById('video');
        video.srcObject = stream;
        await video.play();

        startDetection();
    } catch (error) {
        console.error('Error starting camera:', error);
        const cameraResults = document.getElementById('cameraResults');
        cameraResults.textContent = 'Error: ' + error.message;
    }
}

export function stopCamera() {
    resetState();
    const video = document.getElementById('video');
    if (video) {
        video.srcObject = null;
    }
}

async function detectCodes() {
    const video = document.getElementById('video');
    if (!video || !detectors.dataMatrix) {
        console.error('Video element or detectors not ready');
        return;
    }

    try {
        // Check if video is ready
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            scanTimeout = setTimeout(detectCodes, SCAN_INTERVAL);
            return;
        }

        const results = await Promise.all([
            detectors.dataMatrix.detect(video),
            detectors.qrCode.detect(video),
            detectors.gtin.detect(video),
            detectors.others.detect(video)
        ]);

        const allCodes = results.flat();
        processDetectedCodes(allCodes);

    } catch (error) {
        console.error('Error detecting codes:', error);
    }

    // Schedule next detection only if we still have an active stream
    if (stream) {
        scanTimeout = setTimeout(detectCodes, SCAN_INTERVAL);
    }
}

function processDetectedCodes(codes) {
    const cameraResults = document.getElementById('cameraResults');
    
    codes.forEach(code => {
        if (!detectedCodes.has(code.rawValue)) {
            detectedCodes.add(code.rawValue);
            
            if (code.format.includes('ean') || code.format.includes('upc')) {
                detectedGtins.add(code.rawValue);
            }
        }
    });

    if (detectedCodes.size > 0) {
        updateUI();
    }
}

function updateUI() {
    const cameraResults = document.getElementById('cameraResults');
    const currentBatch = Array.from(detectedCodes).map(code => 
        `Format: ${code.format || 'unknown'}, Value: ${code}`
    ).join('\n');
    
    cameraResults.textContent = currentBatch;
}

function startDetection() {
    detectCodes();
    batchTimeout = setInterval(() => {
        // Process batch here if needed
        detectedCodes.clear();
        detectedGtins.clear();
        updateUI();
    }, BATCH_INTERVAL);
}

// Initialize detectors when the script loads
initializeDetectors().then(success => {
    if (!success) {
        console.warn('Barcode detection might not work properly');
    }
});
