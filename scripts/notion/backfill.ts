/**
 * Usage:
 * bun run notion:backfill --convex-url <convex-url> --backfill-key <backfill-key> [--batch-size <size>] [--target internal-id|eligible-objects]
 *
 * Environment variables:
 * PUBLIC_CONVEX_URL
 * NOTION_BACKFILL_KEY
 */

import {ConvexHttpClient} from 'convex/browser';

type CliConfig = {
    convexUrl: string;
    backfillKey: string;
    batchSize: number;
    target: BackfillTarget;
};

type BackfillTarget = 'internal-id' | 'eligible-objects';

type BackfillPageResult = {
    page: string[];
    isDone: boolean;
    continueCursor: string;
    syncResult?: {synced: number; skipped: number; failed: number} | null;
};

const DEFAULT_BATCH_SIZE = 50;

function parseArgs(argv: string[]): CliConfig {
    const args = [...argv];
    let convexUrl = process.env.PUBLIC_CONVEX_URL?.trim() || '';
    let backfillKey = process.env.NOTION_BACKFILL_KEY?.trim() || '';
    let batchSize = DEFAULT_BATCH_SIZE;
    let target: BackfillTarget = 'internal-id';

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

        if (arg.startsWith('--batch-size=')) {
            batchSize = parseBatchSize(arg.slice('--batch-size='.length));
            continue;
        }
        if (arg === '--batch-size') {
            batchSize = parseBatchSize(args[i + 1] || '');
            i++;
            continue;
        }

        if (arg.startsWith('--target=')) {
            target = parseTarget(arg.slice('--target='.length));
            continue;
        }
        if (arg === '--target') {
            target = parseTarget(args[i + 1] || '');
            i++;
            continue;
        }

        throw new Error(`Unknown argument: ${arg}`);
    }

    if (!convexUrl) {
        throw new Error('Missing Convex URL. Pass --convex-url or set PUBLIC_CONVEX_URL.');
    }
    if (!backfillKey) {
        throw new Error('Missing backfill key. Pass --backfill-key or set NOTION_BACKFILL_KEY.');
    }

    return {
        convexUrl: normalizeBaseUrl(convexUrl),
        backfillKey,
        batchSize,
        target,
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

function parseTarget(value: string): BackfillTarget {
    if (value === 'internal-id' || value === 'eligible-objects') {
        return value;
    }
    throw new Error(`Invalid target: ${value}`);
}

async function fetchBackfillPage(
    client: ConvexHttpClient,
    config: CliConfig,
    cursor: string | null,
): Promise<BackfillPageResult> {
    const actionName =
        config.target === 'eligible-objects'
            ? 'notionSync/backfill:backfillEligibleObjectsPage'
            : 'notionSync/backfill:backfillInternalIdPage';
    return await client.action(
        actionName as never,
        {
            backfillKey: config.backfillKey,
            paginationOpts: {
                cursor,
                numItems: config.batchSize,
            },
        } as never,
    );
}

async function main(): Promise<void> {
    const config = parseArgs(process.argv.slice(2));
    const convexClient = new ConvexHttpClient(config.convexUrl);

    let cursor: string | null = null;
    let pageCount = 0;
    let totalSynced = 0;

    while (true) {
        const page = await fetchBackfillPage(convexClient, config, cursor);
        pageCount += 1;
        totalSynced += page.syncResult?.synced ?? page.page.length;
        const syncSummary = page.syncResult
            ? `, synced=${page.syncResult.synced}, skipped=${page.syncResult.skipped}, failed=${page.syncResult.failed}`
            : '';

        console.log(
            `Processed page ${pageCount}: ${page.page.length} objects${syncSummary} (total synced: ${totalSynced})`,
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
                batchSize: config.batchSize,
                target: config.target,
                pages: pageCount,
                totalSynced,
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
