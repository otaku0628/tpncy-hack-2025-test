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
};

export const validateQRCode = (rawCodeDetected) => {
    try {
        const url = new URL(rawCodeDetected);
        if (GS1_SMARTLINK_DOMAIN_REGEX.test(url.origin)) {
            const sgtinPathMatch = rawCodeDetected.match(GS1_SMARTLINK_SGTIN_PATH_REGEX);
            if (sgtinPathMatch?.groups) {
                const { gtin, serial } = sgtinPathMatch.groups;
                return { isValid: true, code: formatSGTIN(gtin, serial), type: DetectedCodeType.SGTIN };
            }
            const lgtinPathMatch = rawCodeDetected.match(GS1_SMARTLINK_LGTIN_PATH_REGEX);
            if (lgtinPathMatch?.groups) {
                const { gtin, lotNumber } = lgtinPathMatch.groups;
                return { isValid: true, code: formatLGTIN(gtin, lotNumber), type: DetectedCodeType.LGTIN };
            }
            const gtinPathMatch = rawCodeDetected.match(GS1_SMARTLINK_GTIN_PATH_REGEX);
            if (gtinPathMatch?.groups) {
                const { gtin } = gtinPathMatch.groups;
                return { isValid: true, code: gtin, type: DetectedCodeType.GTIN };
            }
        }
    } catch (e) {
        // for invalid url case, try checking if matches DataMatrix format
        return validateDataMatrix(rawCodeDetected);
    }
    return { isValid: false, code: rawCodeDetected, type: DetectedCodeType.UNKNOWN }
};
