import { DETECTOR_CONFIGS } from './constants.js';
import { validateDataMatrix, validateQRCode } from './barcode-utils.js';

let videoStream = null;
let detectionInterval = null;

export async function startCamera() {
    try {
        videoStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        const video = document.getElementById('video');
        video.srcObject = videoStream;
        startDetection();
    } catch (error) {
        console.error('Error accessing camera:', error);
    }
}

export function stopCamera() {
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
        } catch (error) {
            console.error('Detection error:', error);
        }
    }, 200);
}
