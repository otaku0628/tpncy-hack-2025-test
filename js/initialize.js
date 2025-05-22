import { DETECTOR_CONFIGS } from './constants.js';

export async function initializeBarcodeDetector() {
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
