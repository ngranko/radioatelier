const LATITUDE_LIMIT = 90;
const LONGITUDE_LIMIT = 180;

function normalizeCoordinate(value: string | null, limit: number): number | null {
    if (value === null || value.trim() === '') {
        return null;
    }

    const normalizedValue = Number(value);
    if (Number.isFinite(normalizedValue) && Math.abs(normalizedValue) <= limit) {
        return normalizedValue;
    }

    return null;
}

export function normalizeLatitude(value: string | null): number | null {
    return normalizeCoordinate(value, LATITUDE_LIMIT);
}

export function normalizeLongitude(value: string | null): number | null {
    return normalizeCoordinate(value, LONGITUDE_LIMIT);
}
