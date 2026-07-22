import Typesense from 'typesense';

export type CliConfig = {
    convexUrl: string;
    backfillKey: string;
    typesenseUrl: string;
    typesenseAdminKey: string;
    collectionName: string;
    batchSize: number;
};

export type TypesenseClient = InstanceType<typeof Typesense.Client>;

export type BackfillDocument = {
    id: string;
    name: string;
    address: string | null;
    city: string | null;
    country: string | null;
    categoryName: string;
    location: [number, number];
    createdBy: string;
    isPublic: boolean;
};

export type SyncDocument = {
    id: string;
    name: string;
    address?: string;
    city?: string;
    country?: string;
    categoryName: string;
    location: [number, number];
    createdBy: string;
    isPublic: boolean;
};

export type SyncStats = {
    created: number;
    updated: number;
    unchanged: number;
    deleted: number;
};

const DEFAULT_COLLECTION_NAME = process.env.TYPESENSE_COLLECTION?.trim() || 'objects';
const DEFAULT_BATCH_SIZE = 200;

export function parseArgs(argv: string[]): CliConfig {
    const args = [...argv];
    let convexUrl = process.env.PUBLIC_CONVEX_URL?.trim() || '';
    let backfillKey = process.env.TYPESENSE_BACKFILL_KEY?.trim() || '';
    let typesenseUrl = process.env.TYPESENSE_URL?.trim() || '';
    let typesenseAdminKey = process.env.TYPESENSE_ADMIN_KEY?.trim() || '';
    let collectionName = DEFAULT_COLLECTION_NAME;
    let batchSize = DEFAULT_BATCH_SIZE;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        const paired = readPairedArg(args, i);

        if (arg.startsWith('--convex-url=')) {
            convexUrl = arg.slice('--convex-url='.length).trim();
            continue;
        }
        if (arg === '--convex-url') {
            convexUrl = paired.value;
            i = paired.nextIndex;
            continue;
        }

        if (arg.startsWith('--backfill-key=')) {
            backfillKey = arg.slice('--backfill-key='.length).trim();
            continue;
        }
        if (arg === '--backfill-key') {
            backfillKey = paired.value;
            i = paired.nextIndex;
            continue;
        }

        if (arg.startsWith('--typesense-url=')) {
            typesenseUrl = arg.slice('--typesense-url='.length).trim();
            continue;
        }
        if (arg === '--typesense-url') {
            typesenseUrl = paired.value;
            i = paired.nextIndex;
            continue;
        }

        if (arg.startsWith('--typesense-admin-key=')) {
            typesenseAdminKey = arg.slice('--typesense-admin-key='.length).trim();
            continue;
        }
        if (arg === '--typesense-admin-key') {
            typesenseAdminKey = paired.value;
            i = paired.nextIndex;
            continue;
        }

        if (arg.startsWith('--collection=')) {
            collectionName = arg.slice('--collection='.length).trim();
            continue;
        }
        if (arg === '--collection') {
            collectionName = paired.value;
            i = paired.nextIndex;
            continue;
        }

        if (arg.startsWith('--batch-size=')) {
            batchSize = parseBatchSize(arg.slice('--batch-size='.length));
            continue;
        }
        if (arg === '--batch-size') {
            batchSize = parseBatchSize(paired.value);
            i = paired.nextIndex;
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    return validateConfig({
        convexUrl,
        backfillKey,
        typesenseUrl,
        typesenseAdminKey,
        collectionName,
        batchSize,
    });
}

export function createTypesenseClient(config: CliConfig): TypesenseClient {
    return new Typesense.Client({
        apiKey: config.typesenseAdminKey,
        nodes: [{url: config.typesenseUrl}],
        connectionTimeoutSeconds: 10,
    });
}

function readPairedArg(args: string[], index: number) {
    return {
        value: args[index + 1]?.trim() || '',
        nextIndex: index + 1,
    };
}

function parseBatchSize(value: string): number {
    const parsed = Number.parseInt(value.trim(), 10);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new Error(`Invalid batch size: ${value}`);
    }
    return parsed;
}

function normalizeBaseUrl(url: string): string {
    return url.trim().replace(/\/+$/, '');
}

function validateConfig(config: CliConfig): CliConfig {
    if (!config.convexUrl) {
        throw new Error('Missing Convex URL. Pass --convex-url or set PUBLIC_CONVEX_URL.');
    }
    if (!config.backfillKey) {
        throw new Error('Missing backfill key. Pass --backfill-key or set TYPESENSE_BACKFILL_KEY.');
    }
    if (!config.typesenseUrl) {
        throw new Error('Missing Typesense URL. Pass --typesense-url or set TYPESENSE_URL.');
    }
    if (!config.typesenseAdminKey) {
        throw new Error(
            'Missing Typesense admin key. Pass --typesense-admin-key or set TYPESENSE_ADMIN_KEY.',
        );
    }
    if (!config.collectionName) {
        throw new Error('Missing collection name. Pass --collection or set TYPESENSE_COLLECTION.');
    }

    return {
        ...config,
        convexUrl: normalizeBaseUrl(config.convexUrl),
        typesenseUrl: normalizeBaseUrl(config.typesenseUrl),
    };
}
