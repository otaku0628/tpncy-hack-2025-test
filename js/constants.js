export const DetectedCodeType = {
    AZ_CODE: 'AZ_CODE',
    SGTIN: 'SGTIN',
    LGTIN: 'LGTIN',
    GTIN: 'GTIN',
    UNKNOWN: 'UNKNOWN'
};

export const DETECTOR_CONFIGS = {
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
