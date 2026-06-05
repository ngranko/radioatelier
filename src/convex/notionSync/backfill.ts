import {paginationOptsValidator} from 'convex/server';
import {ConvexError, v} from 'convex/values';
import {internal} from '../_generated/api';
import {action, internalQuery} from '../_generated/server';

export const listSyncedObjectIdsPage = internalQuery({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, {paginationOpts}) => {
        const result = await ctx.db.query('objectNotionSync').paginate(paginationOpts);
        return {
            isDone: result.isDone,
            continueCursor: result.continueCursor,
            page: result.page
                .filter(sync => sync.archivedAt == null)
                .map(sync => sync.objectId),
        };
    },
});

export const backfillInternalIdPage = action({
    args: {
        backfillKey: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, {backfillKey, paginationOpts}) => {
        const expectedKey = process.env.NOTION_BACKFILL_KEY?.trim();
        if (!expectedKey) {
            throw new ConvexError('Missing NOTION_BACKFILL_KEY environment variable');
        }
        if (backfillKey !== expectedKey) {
            throw new ConvexError('Unauthorized');
        }

        const page = await ctx.runQuery(internal.notionSync.backfill.listSyncedObjectIdsPage, {
            paginationOpts,
        });
        if (page.page.length > 0) {
            await ctx.runAction(internal.notionSync.outbound.enqueueOutboundObjectSyncBatch, {
                objectIds: page.page,
            });
        }

        return page;
    },
});
