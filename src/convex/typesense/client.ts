import Typesense from 'typesense';

export function createTypesenseSyncClient() {
    if (!process.env.TYPESENSE_SYNC_KEY || !process.env.TYPESENSE_URL) {
        throw new Error('Missing TYPESENSE_SYNC_KEY or TYPESENSE_URL environment variable');
    }

    return createTypesenseClient(process.env.TYPESENSE_SYNC_KEY, process.env.TYPESENSE_URL);
}

export function createTypesenseSearchClient() {
    if (!process.env.TYPESENSE_SEARCH_KEY || !process.env.TYPESENSE_URL) {
        throw new Error('Missing TYPESENSE_SEARCH_KEY or TYPESENSE_URL environment variable');
    }

    return createTypesenseClient(process.env.TYPESENSE_SEARCH_KEY, process.env.TYPESENSE_URL);
}

export function getTypesenseCollectionName() {
    return process.env.TYPESENSE_COLLECTION?.trim() || 'objects';
}

function createTypesenseClient(apiKey: string, url: string) {
    return new Typesense.Client({
        apiKey,
        nodes: [{url}],
        connectionTimeoutSeconds: 10,
    });
}
