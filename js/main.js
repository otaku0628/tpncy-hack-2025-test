// main.js
// Constants
const DetectedCodeType = {
    AZ_CODE: 'AZ_CODE',
    SGTIN: 'SGTIN',
    LGTIN: 'LGTIN',
    GTIN: 'GTIN',
    UNKNOWN: 'UNKNOWN'
};

const DETECTOR_CONFIGS = {
    dataMatrix: {
        formats: ["data_matrix"]
    },
    qrCode: {
        formats: ["qr_code", "micro_qr_code", "rm_qr_code"]
    },
    gtin: {
        formats: ["ean_13", "ean_8", "upc_a", "upc_e"]
    }
};

// Barcode Utils
const AZ_CODE_REGEX = /^(?<azcode>AZ:\w{26})/;
const SGTIN_REGEX = /^(?<sgtin>01\d{14}21\w{1,20})/;
const LGTIN_REGEX = /^(?<lgtin>01\d{14}10\w{1,20})/;
const GS1_SMARTLINK_DOMAIN_REGEX = /(amazon\.com|transparency\.com)/;
const GS1_SMARTLINK_SGTIN_PATH_REGEX = /\/01\/(?<gtin>\d{14})\/21\/(?<serial>\w{1,20})/;
const GS1_SMARTLINK_LGTIN_PATH_REGEX = /\/01\/(?<gtin>\d{14})\/10\/(?<lotNumber>\w{1,20})/;
const GS1_SMARTLINK_GTIN_PATH_REGEX = /\/01\/(?<gtin>\d{14})/;

function validateDataMatrix(rawCodeDetected) {
    const azCodeMatch = rawCodeDetected.match(AZ_CODE_REGEX);
    if (azCodeMatch?.groups) {
        const { azcode } = azCodeMatch.groups;
        return { isValid: true, code: azcode, type: DetectedCodeType.AZ_CODE };
    }
    // ... rest of validation logic
    return { isValid: false, code: rawCodeDetected, type: DetectedCodeType.UNKNOWN };
}

function validateQRCode(rawCodeDetected) {
    // ... QR code validation logic
}

// Initialize
async function initializeBarcodeDetector() {
    try {
        const formats = Object.values(DETECTOR_CONFIGS)
            .flatMap(config => config.formats)
            .filter(Boolean);
            
        const barcodeDetector = new BarcodeDetector({ formats });
        const supportedFormats = await BarcodeDetector.getSupportedFormats();
        
        document.getElementById('supportedFormats').textContent = 
            `Supported formats: ${supportedFormats.join(', ')}`;
    } catch (error) {
        console.error('Barcode Detection failed to initialize:', error);
        document.getElementById('supportedFormats').textContent = 
            'Barcode Detection not supported in this browser.';
    }
}

// Camera Handler
let videoStream = null;
let detectionInterval = null;

async function startCamera() {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = document.getElementById('video');
        video.srcObject = videoStream;
        startDetection();
    } catch (error) {
        console.error('Error accessing camera:', error);
    }
}

function stopCamera() {
    if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
        videoStream = null;
    }
    if (detectionInterval) {
        clearInterval(detectionInterval);
        detectionInterval = null;
    }
}

async function startDetection() {
    const barcodeDetector = new BarcodeDetector();
    const video = document.getElementById('video');

    detectionInterval = setInterval(async () => {
        try {
            const barcodes = await barcodeDetector.detect(video);
            // Process detected barcodes...
            document.getElementById('currentBatch').textContent = 
                `Current detections: ${barcodes.length}`;
        } catch (error) {
            console.error('Detection error:', error);
        }
    }, 200);
}

// Image Handler
async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const img = document.getElementById('imagePreview');
    img.src = URL.createObjectURL(file);
    img.style.display = 'block';

    try {
        const barcodeDetector = new BarcodeDetector();
        const barcodes = await barcodeDetector.detect(img);
        
        const resultsDiv = document.getElementById('imageResults');
        resultsDiv.innerHTML = '';

        if (barcodes.length === 0) {
            resultsDiv.textContent = 'No barcodes detected';
            return;
        }

        barcodes.forEach(barcode => {
            const result = document.createElement('div');
            result.textContent = `Detected: ${barcode.rawValue} (${barcode.format})`;
            resultsDiv.appendChild(result);
        });
    } catch (error) {
        console.error('Error processing image:', error);
    }
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeBarcodeDetector();
    document.getElementById('startCamera').addEventListener('click', startCamera);
    document.getElementById('stopCamera').addEventListener('click', stopCamera);
    document.getElementById('imageInput').addEventListener('change', handleImageUpload);
});
