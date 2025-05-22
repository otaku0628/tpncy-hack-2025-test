// mock/valid-codes.js
export const VALID_CODES = {
    // GTIN -> Set of valid serials
    '12345678901234': new Set(['SERIAL123', 'SERIAL456']),
    '98765432109876': new Set(['TEST789', 'TEST012']),
    // Add more mock data
};

export function mockFilterGtinSerials(gtin, serials) {
    const validSerials = VALID_CODES[gtin];
    if (!validSerials) return { gtinSerials: [] };

    const matchingSerials = serials.filter(serial => validSerials.has(serial))
        .map(serial => `01${gtin}21${serial}`);

    return { gtinSerials: matchingSerials };
}
