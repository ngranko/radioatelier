/**
 * Usage:
 * bun run typesense:backfill --convex-url <convex-url> --backfill-key <backfill-key> --typesense-url <typesense-url> --typesense-admin-key <typesense-admin-key> [--collection <name>] [--batch-size <size>]
 *
 * Environment variables:
 * PUBLIC_CONVEX_URL
 * TYPESENSE_BACKFILL_KEY
 * TYPESENSE_URL
 * TYPESENSE_ADMIN_KEY
 * TYPESENSE_COLLECTION
 */

import {ConvexHttpClient} from 'convex/browser';
import Typesense from 'typesense';

type CliConfig = {
    convexUrl: string;
    backfillKey: string;
    typesenseUrl: string;
    typesenseAdminKey: string;
    collectionName: string;
    batchSize: number;
};

type TypesenseClient = InstanceType<typeof Typesense.Client>;

type BackfillDocument = {
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

type PaginationResult<T> = {
    page: T[];
    isDone: boolean;
    continueCursor: string;
};

const DEFAULT_COLLECTION_NAME = process.env.TYPESENSE_COLLECTION?.trim() || 'objects';
const DEFAULT_BATCH_SIZE = 200;

function parseArgs(argv: string[]): CliConfig {
    const args = [...argv];
    let convexUrl = process.env.PUBLIC_CONVEX_URL?.trim() || '';
    let backfillKey = process.env.TYPESENSE_BACKFILL_KEY?.trim() || '';
    let typesenseUrl = process.env.TYPESENSE_URL?.trim() || '';
    let typesenseAdminKey = process.env.TYPESENSE_ADMIN_KEY?.trim() || '';
    let collectionName = DEFAULT_COLLECTION_NAME;
    let batchSize = DEFAULT_BATCH_SIZE;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];

        if (arg.startsWith('--convex-url=')) {
            convexUrl = arg.slice('--convex-url='.length).trim();
            continue;
        }
        if (arg === '--convex-url') {
            convexUrl = args[i + 1]?.trim() || '';
            i++;
            continue;
        }

        if (arg.startsWith('--backfill-key=')) {
            backfillKey = arg.slice('--backfill-key='.length).trim();
            continue;
        }
        if (arg === '--backfill-key') {
            backfillKey = args[i + 1]?.trim() || '';
            i++;
            continue;
        }

        if (arg.startsWith('--typesense-url=')) {
            typesenseUrl = arg.slice('--typesense-url='.length).trim();
            continue;
        }
        if (arg === '--typesense-url') {
            typesenseUrl = args[i + 1]?.trim() || '';
            i++;
            continue;
        }

        if (arg.startsWith('--typesense-admin-key=')) {
            typesenseAdminKey = arg.slice('--typesense-admin-key='.length).trim();
            continue;
        }
        if (arg === '--typesense-admin-key') {
            typesenseAdminKey = args[i + 1]?.trim() || '';
            i++;
            continue;
        }

        if (arg.startsWith('--collection=')) {
            collectionName = arg.slice('--collection='.length).trim();
            continue;
        }
        if (arg === '--collection') {
            collectionName = args[i + 1]?.trim() || '';
            i++;
            continue;
        }

        if (arg.startsWith('--batch-size=')) {
            batchSize = parseBatchSize(arg.slice('--batch-size='.length));
            continue;
        }
        if (arg === '--batch-size') {
            batchSize = parseBatchSize(args[i + 1] || '');
            i++;
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    if (!convexUrl) {
        throw new Error('Missing Convex URL. Pass --convex-url or set PUBLIC_CONVEX_URL.');
    }
    if (!backfillKey) {
        throw new Error('Missing backfill key. Pass --backfill-key or set TYPESENSE_BACKFILL_KEY.');
    }
    if (!typesenseUrl) {
        throw new Error('Missing Typesense URL. Pass --typesense-url or set TYPESENSE_URL.');
    }
    if (!typesenseAdminKey) {
        throw new Error(
            'Missing Typesense admin key. Pass --typesense-admin-key or set TYPESENSE_ADMIN_KEY.',
        );
    }
    if (!collectionName) {
        throw new Error('Missing collection name. Pass --collection or set TYPESENSE_COLLECTION.');
    }

    return {
        convexUrl: normalizeBaseUrl(convexUrl),
        backfillKey,
        typesenseUrl: normalizeBaseUrl(typesenseUrl),
        typesenseAdminKey,
        collectionName,
        batchSize,
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

function createTypesenseClient(config: CliConfig) {
    return new Typesense.Client({
        apiKey: config.typesenseAdminKey,
        nodes: [{url: config.typesenseUrl}],
        connectionTimeoutSeconds: 10,
    });
}

async function collectionExists(client: TypesenseClient, config: CliConfig): Promise<boolean> {
    return await client.collections(config.collectionName).exists();
}

function toTypesenseDocument(source: BackfillDocument) {
    const document: Record<string, unknown> = {
        id: source.id,
        name: source.name,
        categoryName: source.categoryName,
        location: source.location,
        createdBy: source.createdBy,
        isPublic: source.isPublic,
    };

    addOptionalString(document, 'address', source.address);
    addOptionalString(document, 'city', source.city);
    addOptionalString(document, 'country', source.country);

    return document;
}

function addOptionalString(target: Record<string, unknown>, key: string, value: string | null) {
    const normalized = value?.trim();
    if (normalized) {
        target[key] = normalized;
    }
}

// needed only for backfilling the database, should be removed later
async function fetchBackfillPage(
    client: ConvexHttpClient,
    config: CliConfig,
    cursor: string | null,
): Promise<PaginationResult<BackfillDocument>> {
    return await client.action(
        'typesense:getBackfillPage' as never,
        {
            backfillKey: config.backfillKey,
            paginationOpts: {
                cursor,
                numItems: config.batchSize,
            },
        } as never,
    );
}

async function importDocuments(
    client: TypesenseClient,
    config: CliConfig,
    documents: Record<string, unknown>[],
) {
    if (documents.length === 0) {
        return {successCount: 0};
    }

    const results = await client.collections(config.collectionName).documents().import(documents, {
        action: 'upsert',
        throwOnFail: false,
    });

    const failed = results.filter(result => !result.success);
    if (failed.length > 0) {
        const details = failed
            .slice(0, 3)
            .map(result => result.error || 'Unknown import error')
            .join('; ');
        throw new Error(`Typesense rejected ${failed.length} documents: ${details}`);
    }

    return {successCount: results.length};
}

async function main(): Promise<void> {
    const config = parseArgs(process.argv.slice(2));
    const typesenseClient = createTypesenseClient(config);
    const hasCollection = await collectionExists(typesenseClient, config);
    if (!hasCollection) {
        throw new Error(
            `Typesense collection "${config.collectionName}" does not exist. Run bun run typesense:setup first.`,
        );
    }

    const convexClient = new ConvexHttpClient(config.convexUrl);

    let cursor: string | null = null;
    let pageCount = 0;
    let totalImported = 0;

    while (true) {
        const page = await fetchBackfillPage(convexClient, config, cursor);
        const documents = page.page.map(toTypesenseDocument);
        const {successCount} = await importDocuments(typesenseClient, config, documents);

        pageCount += 1;
        totalImported += successCount;

        console.log(
            `Imported page ${pageCount}: ${successCount} documents (total: ${totalImported})`,
        );

        if (page.isDone) {
            break;
        }

        cursor = page.continueCursor;
    }

    console.log(
        JSON.stringify(
            {
                convexUrl: config.convexUrl,
                collection: config.collectionName,
                batchSize: config.batchSize,
                pages: pageCount,
                totalImported,
            },
            null,
            2,
        ),
    );
}

main().catch(error => {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
});
