// js/initialize.js
export async function initializeBarcodeDetector() {

    try {
        // Wait for polyfill to load
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        let formats;
        try {
            formats = await BarcodeDetector.getSupportedFormats();
        } catch (e) {
            console.error('Initialization error:', error);
        }

        const supportedFormatsDiv = document.getElementById('supportedFormats');
        
        if (formats && formats.length > 0) {
            supportedFormatsDiv.innerHTML = `
                <h3>Native Support:</h3>
                <div class="format-list">${formats.join(', ')}</div>
            `;
        } else {
            supportedFormatsDiv.innerHTML = `
                <h3>Polyfill Support:</h3>
                <div class="format-list">${supportedFormats.join(', ')}</div>
                <div class="note">(Using barcode-detector polyfill)</div>
            `;
        }
    } catch (error) {
        console.error('Initialization error:', error);
        document.getElementById('supportedFormats').innerHTML = `
            <div class="error">Error initializing barcode detector. Using polyfill.</div>
            <div class="format-list">${supportedFormats.join(', ')}</div>
        `;
    }
}
