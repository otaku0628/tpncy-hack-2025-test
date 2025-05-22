import { DetectedCodeType } from './constants.js';

const AZ_CODE_REGEX = /^(?<azcode>AZ:\w{26})/;
const SGTIN_REGEX = /^(?<sgtin>01\d{14}21\w{1,20})/;
const LGTIN_REGEX = /^(?<lgtin>01\d{14}10\w{1,20})/;
const GS1_SMARTLINK_DOMAIN_REGEX = /(amazon\.com|transparency\.com)/;
const GS1_SMARTLINK_SGTIN_PATH_REGEX = /\/01\/(?<gtin>\d{14})\/21\/(?<serial>\w{1,20})/;
const GS1_SMARTLINK_LGTIN_PATH_REGEX = /\/01\/(?<gtin>\d{14})\/10\/(?<lotNumber>\w{1,20})/;
const GS1_SMARTLINK_GTIN_PATH_REGEX = /\/01\/(?<gtin>\d{14})/;

export const validateDataMatrix = (rawCodeDetected) => {
    const azCodeMatch = rawCodeDetected.match(AZ_CODE_REGEX);
    if (azCodeMatch?.groups) {
        const { azcode } = azCodeMatch.groups;
        return { isValid: true, code: azcode, type: DetectedCodeType.AZ_CODE };
    }
    // ... rest of your validation logic
    return { isValid: false, code: rawCodeDetected, type: DetectedCodeType.UNKNOWN };
};

export const validateQRCode = (rawCodeDetected) => {
    // ... your QR code validation logic
};
