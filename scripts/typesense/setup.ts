/**
 * Usage:
 * bun run typesense:setup --url <typesense-url> --admin-key <admin-key> [--collection <name>]
 *
 * Environment variables:
 * TYPESENSE_URL
 * TYPESENSE_ADMIN_KEY
 * TYPESENSE_COLLECTION
 */

import type {CollectionCreateSchema, KeyCreateSchema, KeySchema} from 'typesense';
import Typesense from 'typesense';

type CliConfig = {
    url: string;
    adminKey: string;
    collectionName: string;
};

type TypesenseClient = InstanceType<typeof Typesense.Client>;

const DEFAULT_COLLECTION_NAME = process.env.TYPESENSE_COLLECTION?.trim() || 'objects';

function parseArgs(argv: string[]): CliConfig {
    const args = [...argv];
    let url = process.env.TYPESENSE_URL?.trim() || '';
    let adminKey = process.env.TYPESENSE_ADMIN_KEY?.trim() || '';
    let collectionName = DEFAULT_COLLECTION_NAME;

    for (let i = 0; i < args.length; i++) {
        const arg = args[i];
        if (arg.startsWith('--url=')) {
            url = arg.slice('--url='.length).trim();
            continue;
        }
        if (arg === '--url') {
            url = args[i + 1]?.trim() || '';
            i++;
            continue;
        }
        if (arg.startsWith('--admin-key=')) {
            adminKey = arg.slice('--admin-key='.length).trim();
            continue;
        }
        if (arg === '--admin-key') {
            adminKey = args[i + 1]?.trim() || '';
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
        throw new Error(`Unknown argument: ${arg}`);
    }

    if (!url) {
        throw new Error('Missing Typesense URL. Pass --url or set TYPESENSE_URL.');
    }
    if (!adminKey) {
        throw new Error(
            'Missing Typesense admin key. Pass --admin-key or set TYPESENSE_ADMIN_KEY.',
        );
    }
    if (!collectionName) {
        throw new Error('Missing collection name. Pass --collection or set TYPESENSE_COLLECTION.');
    }

    return {
        url: normalizeBaseUrl(url),
        adminKey,
        collectionName,
    };
}

function normalizeBaseUrl(url: string): string {
    return url.trim().replace(/\/+$/, '');
}

function createClient(config: CliConfig) {
    return new Typesense.Client({
        apiKey: config.adminKey,
        nodes: [{url: config.url}],
        connectionTimeoutSeconds: 10,
    });
}

function createCollectionSchema(name: string): CollectionCreateSchema {
    return {
        name,
        fields: [
            {name: 'id', type: 'string'},
            {name: 'name', type: 'string'},
            {name: 'address', type: 'string', optional: true},
            {name: 'city', type: 'string', optional: true},
            {name: 'country', type: 'string', optional: true},
            {name: 'categoryName', type: 'string'},
            {name: 'location', type: 'geopoint'},
            {name: 'createdBy', type: 'string', facet: true},
            {name: 'isPublic', type: 'bool', facet: true},
        ],
    };
}

async function ensureCollection(
    client: TypesenseClient,
    config: CliConfig,
): Promise<'created' | 'existing'> {
    const exists = await client.collections(config.collectionName).exists();
    if (exists) {
        return 'existing';
    }

    await client.collections().create(createCollectionSchema(config.collectionName));
    return 'created';
}

function createKeySchema(collectionName: string, kind: 'sync' | 'search'): KeyCreateSchema {
    if (kind === 'sync') {
        return {
            description: `${collectionName} backend sync key`,
            actions: ['documents:*'],
            collections: [collectionName],
        };
    }

    return {
        description: `${collectionName} search key`,
        actions: ['documents:search'],
        collections: [collectionName],
    };
}

async function createScopedKey(
    client: TypesenseClient,
    config: CliConfig,
    kind: 'sync' | 'search',
): Promise<KeySchema> {
    return await client.keys().create(createKeySchema(config.collectionName, kind));
}

async function main(): Promise<void> {
    const config = parseArgs(process.argv.slice(2));
    const client = createClient(config);
    const collectionStatus = await ensureCollection(client, config);
    if (collectionStatus === 'existing') {
        console.log('Collection already exists, the setup is probably already done');
        return;
    }
    const [syncKey, searchKey] = await Promise.all([
        createScopedKey(client, config, 'sync'),
        createScopedKey(client, config, 'search'),
    ]);

    console.log(
        JSON.stringify(
            {
                url: config.url,
                collection: config.collectionName,
                collectionStatus,
                syncKey: {
                    id: syncKey.id,
                    description: syncKey.description,
                    value: syncKey.value,
                    actions: syncKey.actions,
                    collections: syncKey.collections,
                },
                searchKey: {
                    id: searchKey.id,
                    description: searchKey.description,
                    value: searchKey.value,
                    actions: searchKey.actions,
                    collections: searchKey.collections,
                },
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
