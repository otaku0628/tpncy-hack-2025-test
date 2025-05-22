// js/constants.js
export const SCAN_INTERVAL = 100;
export const BATCH_INTERVAL = 3000;
export const MAX_ATTEMPTS = 3;

export const DETECTOR_CONFIGS = {
    dataMatrix: { formats: ["data_matrix"] },
    qrCode: { formats: ["qr_code"] },
    gtin: { formats: ["ean_13", "ean_8", "upc_a", "upc_e"] },
    others: {}
};
