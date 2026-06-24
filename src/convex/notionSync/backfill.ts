import {paginationOptsValidator} from 'convex/server';
import {ConvexError, v} from 'convex/values';
import {internal} from '../_generated/api';
import type {Id} from '../_generated/dataModel';
import {action, internalQuery} from '../_generated/server';

type SyncedObjectIdsPage = {
    page: Id<'objects'>[];
    isDone: boolean;
    continueCursor: string;
};

type BackfillEligibleObjectsPageResult = SyncedObjectIdsPage & {
    syncResult: {synced: number; skipped: number; failed: number} | null;
};

export const listSyncedObjectIdsPage = internalQuery({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, {paginationOpts}): Promise<SyncedObjectIdsPage> => {
        const result = await ctx.db.query('objectNotionSync').paginate(paginationOpts);
        return {
            isDone: result.isDone,
            continueCursor: result.continueCursor,
            page: result.page.filter(sync => sync.archivedAt == null).map(sync => sync.objectId),
        };
    },
});

export const backfillInternalIdPage = action({
    args: {
        backfillKey: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, {backfillKey, paginationOpts}): Promise<SyncedObjectIdsPage> => {
        assertAuthorizedBackfill(backfillKey);

        const page: SyncedObjectIdsPage = await ctx.runQuery(
            internal.notionSync.backfill.listSyncedObjectIdsPage,
            {
                paginationOpts,
            },
        );
        if (page.page.length > 0) {
            await ctx.runAction(internal.notionSync.outbound.enqueueOutboundObjectSyncBatch, {
                objectIds: page.page,
            });
        }

        return page;
    },
});

export const backfillEligibleObjectsPage = action({
    args: {
        backfillKey: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (
        ctx,
        {backfillKey, paginationOpts},
    ): Promise<BackfillEligibleObjectsPageResult> => {
        assertAuthorizedBackfill(backfillKey);

        const page: SyncedObjectIdsPage = await ctx.runQuery(
            internal.notionSync.snapshot.listEligibleObjectIdsPage,
            {
                paginationOpts,
            },
        );
        const syncResult =
            page.page.length > 0
                ? ((await ctx.runAction(
                      internal.notionSync.outbound.enqueueOutboundObjectSyncBatchLenient,
                      {
                          objectIds: page.page,
                      },
                  )) as BackfillEligibleObjectsPageResult['syncResult'])
                : null;

        return {
            ...page,
            syncResult,
        };
    },
});

function assertAuthorizedBackfill(backfillKey: string) {
    const expectedKey = process.env.NOTION_BACKFILL_KEY?.trim();
    if (!expectedKey) {
        throw new ConvexError('Missing NOTION_BACKFILL_KEY environment variable');
    }
    if (backfillKey !== expectedKey) {
        throw new ConvexError('Unauthorized');
    }
}
