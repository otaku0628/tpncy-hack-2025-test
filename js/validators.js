// js/validators.js

// Enum-like object for detected code types
export const DetectedCodeType = {
    AZ_CODE: 'AZ_CODE',
    SGTIN: 'SGTIN',
    LGTIN: 'LGTIN',
    GTIN: 'GTIN',
    UNKNOWN: 'UNKNOWN'
};

// Format validation constants
const AZ_CODE_REGEX = /^(?<azcode>AZ:\w{26})/;
const SGTIN_REGEX = /^(?<sgtin>01\d{14}21\w{1,20})/;
const LGTIN_REGEX = /^(?<lgtin>01\d{14}10\w{1,20})/;
const GS1_SMARTLINK_DOMAIN_REGEX = /(amazon\.com|transparency\.com)/;
const GS1_SMARTLINK_SGTIN_PATH_REGEX = /\/01\/(?<gtin>\d{14})\/21\/(?<serial>\w{1,20})/;
const GS1_SMARTLINK_LGTIN_PATH_REGEX = /\/01\/(?<gtin>\d{14})\/10\/(?<lotNumber>\w{1,20})/;
const GS1_SMARTLINK_GTIN_PATH_REGEX = /\/01\/(?<gtin>\d{14})/;

/**
 * Formats a GTIN and serial into an SGTIN element string
 */
export function formatSGTIN(gtin, serial) {
    return `01${gtin.padStart(14, '0')}21${serial}`;
}

/**
 * Formats a GTIN and lot number into an LGTIN element string
 */
export function formatLGTIN(gtin, lotNumber) {
    return `01${gtin.padStart(14, '0')}10${lotNumber}`;
}

/**
 * Validates Data Matrix codes for AZ, SGTIN, and LGTIN formats
 * @param {string} rawCodeDetected - The raw code to validate
 * @returns {{isValid: boolean, code: string, type: string}} Validation result
 */
export function validateDataMatrix(rawCodeDetected) {
    const azCodeMatch = rawCodeDetected.match(AZ_CODE_REGEX);
    if (azCodeMatch?.groups) {
        const { azcode } = azCodeMatch.groups;
        return { isValid: true, code: azcode, type: DetectedCodeType.AZ_CODE };
    }

    const sgtinMatch = rawCodeDetected.match(SGTIN_REGEX);
    if (sgtinMatch?.groups) {
        const { sgtin } = sgtinMatch.groups;
        return { isValid: true, code: sgtin, type: DetectedCodeType.SGTIN };
    }

    const lgtinMatch = rawCodeDetected.match(LGTIN_REGEX);
    if (lgtinMatch?.groups) {
        const { lgtin } = lgtinMatch.groups;
        return { isValid: true, code: lgtin, type: DetectedCodeType.LGTIN };
    }

    return { isValid: false, code: rawCodeDetected, type: DetectedCodeType.UNKNOWN };
}

/**
 * Validates QR codes for GS1 SmartLink format and converts to element string
 * @param {string} rawCodeDetected - The raw code to validate
 * @returns {{isValid: boolean, code: string, type: string}} Validation result
 */
export function validateQRCode(rawCodeDetected) {
    try {
        const url = new URL(rawCodeDetected);
        if (GS1_SMARTLINK_DOMAIN_REGEX.test(url.origin)) {
            // Check for SGTIN path
            const sgtinPathMatch = rawCodeDetected.match(GS1_SMARTLINK_SGTIN_PATH_REGEX);
            if (sgtinPathMatch?.groups) {
                const { gtin, serial } = sgtinPathMatch.groups;
                return { 
                    isValid: true, 
                    code: formatSGTIN(gtin, serial), 
                    type: DetectedCodeType.SGTIN 
                };
            }

            // Check for LGTIN path
            const lgtinPathMatch = rawCodeDetected.match(GS1_SMARTLINK_LGTIN_PATH_REGEX);
            if (lgtinPathMatch?.groups) {
                const { gtin, lotNumber } = lgtinPathMatch.groups;
                return { 
                    isValid: true, 
                    code: formatLGTIN(gtin, lotNumber), 
                    type: DetectedCodeType.LGTIN 
                };
            }

            // Check for GTIN-only path
            const gtinPathMatch = rawCodeDetected.match(GS1_SMARTLINK_GTIN_PATH_REGEX);
            if (gtinPathMatch?.groups) {
                const { gtin } = gtinPathMatch.groups;
                return { 
                    isValid: true, 
                    code: gtin, 
                    type: DetectedCodeType.GTIN 
                };
            }
        }
    } catch (e) {
        // For invalid URL case, try checking if matches DataMatrix format
        return validateDataMatrix(rawCodeDetected);
    }

    return { isValid: false, code: rawCodeDetected, type: DetectedCodeType.UNKNOWN };
}

/**
 * Extract GTIN from a code if present
 * @param {string} code - The code to extract GTIN from
 * @returns {string|null} The extracted GTIN or null if not found
 */
export function extractGTIN(code) {
    const sgtinMatch = code.match(/^01(\d{14})21/);
    if (sgtinMatch) return sgtinMatch[1];

    const lgtinMatch = code.match(/^01(\d{14})10/);
    if (lgtinMatch) return lgtinMatch[1];

    return null;
}

/**
 * Extract serial from SGTIN if present
 * @param {string} code - The code to extract serial from
 * @returns {string|null} The extracted serial or null if not found
 */
export function extractSerial(code) {
    const match = code.match(/^01\d{14}21(\w{1,20})/);
    return match ? match[1] : null;
}
