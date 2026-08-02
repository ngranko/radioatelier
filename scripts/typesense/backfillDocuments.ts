import type {BackfillDocument, SyncDocument} from './backfillConfig';

export function toSyncDocument(source: BackfillDocument): SyncDocument {
    return normalizeRawDocument({
        id: source.id,
        name: source.name,
        address: source.address,
        city: source.city,
        country: source.country,
        categoryName: source.categoryName,
        location: source.location,
        createdBy: source.createdBy,
        isPublic: source.isPublic,
    });
}

export function normalizeRawDocument(source: Record<string, unknown>): SyncDocument {
    const document: SyncDocument = {
        id: asRequiredString(source.id, 'id'),
        name: asRequiredString(source.name, 'name'),
        categoryName: asRequiredString(source.categoryName, 'categoryName'),
        location: asLocation(source.location),
        createdBy: asRequiredString(source.createdBy, 'createdBy'),
        isPublic: asBoolean(source.isPublic),
    };

    addOptionalString(document, 'address', source.address);
    addOptionalString(document, 'city', source.city);
    addOptionalString(document, 'country', source.country);
    return document;
}

export function documentsEqual(left: SyncDocument, right: SyncDocument): boolean {
    return JSON.stringify(left) === JSON.stringify(right);
}

function addOptionalString(
    target: SyncDocument,
    key: 'address' | 'city' | 'country',
    value: unknown,
) {
    if (typeof value !== 'string') {
        return;
    }
    const normalized = value.trim();
    if (normalized) {
        target[key] = normalized;
    }
}

function asRequiredString(value: unknown, field: string): string {
    if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`Invalid document field "${field}"`);
    }
    return value;
}

function asBoolean(value: unknown): boolean {
    if (typeof value !== 'boolean') {
        throw new Error('Invalid document field "isPublic"');
    }
    return value;
}

function asLocation(value: unknown): [number, number] {
    if (!Array.isArray(value) || value.length !== 2) {
        throw new Error('Invalid document field "location"');
    }
    const [latitude, longitude] = value;
    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
        throw new Error('Invalid document field "location"');
    }
    return [latitude, longitude];
}
