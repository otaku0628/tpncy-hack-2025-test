import { validateDataMatrix, validateQRCode } from './barcode-utils.js';

export async function handleImageUpload(event) {
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
