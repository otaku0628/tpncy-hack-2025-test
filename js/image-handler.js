// js/image-handler.js
import { validateDataMatrix, validateQRCode } from './validators.js';
import { DETECTOR_CONFIGS } from './constants.js';

let detectors = null;

export async function initializeDetectors() {
    try {
        detectors = {
            dataMatrix: new BarcodeDetector(DETECTOR_CONFIGS.dataMatrix),
            qrCode: new BarcodeDetector(DETECTOR_CONFIGS.qrCode),
            gtin: new BarcodeDetector(DETECTOR_CONFIGS.gtin),
            others: new BarcodeDetector()
        };
    } catch (error) {
        console.error('Error initializing detectors:', error);
    }
}

export async function handleImageUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    const imagePreview = document.getElementById('imagePreview');
    const imageResults = document.getElementById('imageResults');

    imageResults.innerHTML = '<span class="loading">Processing image...</span>';
    imagePreview.style.display = 'none';

    try {
        const image = await loadImage(file);
        imagePreview.src = image.src;
        imagePreview.style.display = 'block';

        const codes = await detectCodesInImage(image);
        displayImageResults(codes);
    } catch (error) {
        imageResults.textContent = 'Error processing image: ' + error.message;
    }
}

function loadImage(file) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
    });
}

async function detectCodesInImage(image) {
    const results = await Promise.all([
        detectors.dataMatrix.detect(image),
        detectors.qrCode.detect(image),
        detectors.gtin.detect(image),
        detectors.others.detect(image)
    ]);

    return results.flat();
}

function displayImageResults(codes) {
    const imageResults = document.getElementById('imageResults');
    const actionButtons = document.getElementById('imageActionButtons');

    if (codes.length === 0) {
        imageResults.textContent = 'No barcodes detected';
        actionButtons.classList.remove('visible');
        return;
    }

    let validTpncyCode = null;
    const detectedCodes = codes.map(code => {
        let result = validateDataMatrix(code.rawValue);
        if (!result.isValid) {
            result = validateQRCode(code.rawValue);
        }
        if (result.isValid && !validTpncyCode) {
            validTpncyCode = result.code;
        }
        return `Format: ${code.format}, Value: ${code.rawValue}`;
    });

    imageResults.innerHTML = detectedCodes.join('<br>');

    if (validTpncyCode) {
        actionButtons.classList.add('visible');
        const redirectButton = document.getElementById('imageRedirectButton');
        const redirectLink = document.getElementById('imageRedirectLink');
        redirectButton.onclick = () => window.location.href = `/product/${encodeURIComponent(validTpncyCode)}`;
        redirectLink.href = `/product/${encodeURIComponent(validTpncyCode)}`;
        redirectLink.textContent = `/product/${validTpncyCode}`;
    } else {
        actionButtons.classList.remove('visible');
    }
}

// Initialize detectors when the script loads
initializeDetectors();
