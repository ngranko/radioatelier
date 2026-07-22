/**
 * Usage:
 * bun scripts/typesense/backfill.ts --convex-url <convex-url> --backfill-key <backfill-key> --typesense-url <typesense-url> --typesense-admin-key <typesense-admin-key> [--collection <name>] [--batch-size <size>]
 *
 * Environment variables:
 * PUBLIC_CONVEX_URL
 * TYPESENSE_BACKFILL_KEY
 * TYPESENSE_URL
 * TYPESENSE_ADMIN_KEY
 * TYPESENSE_COLLECTION
 */

import {ConvexHttpClient} from 'convex/browser';
import {createTypesenseClient, parseArgs} from './backfillConfig';
import {
    applySyncPlan,
    exportExistingDocuments,
    fetchAllConvexDocuments,
    planSync,
} from './backfillSync';

async function main(): Promise<void> {
    const config = parseArgs(process.argv.slice(2));
    const typesenseClient = createTypesenseClient(config);
    const hasCollection = await typesenseClient.collections(config.collectionName).exists();
    if (!hasCollection) {
        throw new Error(
            `Typesense collection "${config.collectionName}" does not exist. Run bun scripts/typesense/setup.ts first.`,
        );
    }

    console.log('Exporting existing Typesense documents...');
    const existing = await exportExistingDocuments(typesenseClient, config);
    console.log(`Found ${existing.size} documents in Typesense.`);

    console.log('Fetching Convex objects...');
    const desired = await fetchAllConvexDocuments(new ConvexHttpClient(config.convexUrl), config);
    console.log(`Found ${desired.length} objects in Convex.`);

    const plan = planSync(desired, existing);
    console.log(
        `Plan: create=${plan.toCreate.length}, update=${plan.toUpdate.length}, unchanged=${plan.unchanged}, delete=${plan.toDelete.length}`,
    );

    const stats = await applySyncPlan(typesenseClient, config, plan);

    console.log(
        JSON.stringify(
            {
                convexUrl: config.convexUrl,
                collection: config.collectionName,
                batchSize: config.batchSize,
                created: stats.created,
                updated: stats.updated,
                unchanged: stats.unchanged,
                deleted: stats.deleted,
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
