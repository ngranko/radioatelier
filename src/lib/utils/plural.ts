export function pluralizeRussian(count: number, forms: [string, string, string]) {
    const lastTwoDigits = Math.abs(count) % 100;
    const lastDigit = lastTwoDigits % 10;

    if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
        return forms[2];
    }
    if (lastDigit === 1) {
        return forms[0];
    }
    if (lastDigit >= 2 && lastDigit <= 4) {
        return forms[1];
    }
    return forms[2];
}
