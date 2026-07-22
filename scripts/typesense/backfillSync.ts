import type {ConvexHttpClient} from 'convex/browser';
import type {
    BackfillDocument,
    CliConfig,
    SyncDocument,
    SyncStats,
    TypesenseClient,
} from './backfillConfig';
import {documentsEqual, normalizeRawDocument, toSyncDocument} from './backfillDocuments';

type PaginationResult<T> = {
    page: T[];
    isDone: boolean;
    continueCursor: string;
};

type SyncPlan = {
    toCreate: SyncDocument[];
    toUpdate: SyncDocument[];
    unchanged: number;
    toDelete: string[];
};

export async function exportExistingDocuments(
    client: TypesenseClient,
    config: CliConfig,
): Promise<Map<string, SyncDocument>> {
    const jsonl = await client.collections(config.collectionName).documents().export();
    const documents = new Map<string, SyncDocument>();

    for (const line of jsonl.split('\n')) {
        if (!line.trim()) {
            continue;
        }
        const document = normalizeRawDocument(JSON.parse(line) as Record<string, unknown>);
        documents.set(document.id, document);
    }

    return documents;
}

export async function fetchAllConvexDocuments(
    client: ConvexHttpClient,
    config: CliConfig,
): Promise<SyncDocument[]> {
    const documents: SyncDocument[] = [];
    let cursor: string | null = null;

    while (true) {
        const page = await fetchBackfillPage(client, config, cursor);
        documents.push(...page.page.map(toSyncDocument));
        if (page.isDone) {
            break;
        }
        cursor = page.continueCursor;
    }

    return documents;
}

export function planSync(desired: SyncDocument[], existing: Map<string, SyncDocument>): SyncPlan {
    const toCreate: SyncDocument[] = [];
    const toUpdate: SyncDocument[] = [];
    let unchanged = 0;
    const seen = new Set<string>();

    for (const document of desired) {
        seen.add(document.id);
        const current = existing.get(document.id);
        if (!current) {
            toCreate.push(document);
            continue;
        }
        if (documentsEqual(current, document)) {
            unchanged += 1;
            continue;
        }
        toUpdate.push(document);
    }

    return {
        toCreate,
        toUpdate,
        unchanged,
        toDelete: [...existing.keys()].filter(id => !seen.has(id)),
    };
}

export async function applySyncPlan(
    client: TypesenseClient,
    config: CliConfig,
    plan: SyncPlan,
): Promise<SyncStats> {
    return {
        created: await importDocuments(client, config, plan.toCreate, 'create'),
        // upsert replaces the whole document so dropped optional fields are cleared
        updated: await importDocuments(client, config, plan.toUpdate, 'upsert'),
        unchanged: plan.unchanged,
        deleted: await deleteDocuments(client, config, plan.toDelete),
    };
}

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
    documents: SyncDocument[],
    action: 'create' | 'upsert',
): Promise<number> {
    if (documents.length === 0) {
        return 0;
    }

    let imported = 0;
    for (const batch of chunk(documents, config.batchSize)) {
        const results = await client.collections(config.collectionName).documents().import(batch, {
            action,
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

        imported += results.length;
    }

    return imported;
}

async function deleteDocuments(
    client: TypesenseClient,
    config: CliConfig,
    ids: string[],
): Promise<number> {
    if (ids.length === 0) {
        return 0;
    }

    let deleted = 0;
    for (const batch of chunk(ids, config.batchSize)) {
        const result = await client
            .collections(config.collectionName)
            .documents()
            .delete({
                filter_by: `id:=[${batch.join(',')}]`,
                batch_size: config.batchSize,
            });
        deleted += result.num_deleted;
    }

    return deleted;
}

function chunk<T>(items: T[], size: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += size) {
        batches.push(items.slice(i, i + size));
    }
    return batches;
}
