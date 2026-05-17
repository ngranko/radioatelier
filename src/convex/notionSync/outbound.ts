import {v} from 'convex/values';
import {internal} from '../_generated/api';
import {internalAction} from '../_generated/server';
import {archivePage} from '../notion/client';
import {performOutboundObjectSync} from './outboundObjectSync';

export const enqueueOutboundObjectSync = internalAction({
    args: {
        objectId: v.id('objects'),
    },
    handler: async (ctx, {objectId}) => {
        return await performOutboundObjectSync(ctx, objectId);
    },
});

export const enqueueOutboundObjectSyncBatch = internalAction({
    args: {
        objectIds: v.array(v.id('objects')),
    },
    handler: async (ctx, {objectIds}) => {
        const uniqueObjectIds = [...new Set(objectIds)];
        for (const objectId of uniqueObjectIds) {
            await ctx.runAction(internal.notionSync.outbound.enqueueOutboundObjectSync, {
                objectId,
            });
        }

        return uniqueObjectIds.length;
    },
});

export const archiveDeletedObjectPage = internalAction({
    args: {
        objectId: v.id('objects'),
        notionPageId: v.string(),
    },
    handler: async (ctx, {objectId, notionPageId}) => {
        try {
            await archivePage(notionPageId);
            await ctx.runMutation(internal.notionSync.state.patchSyncState, {
                objectId,
                message: null,
            });
        } catch (error) {
            await ctx.runMutation(internal.notionSync.state.patchSyncState, {
                objectId,
                message: error instanceof Error ? error.message : 'Unknown Notion archive error',
            });
            throw error;
        }
    },
});
