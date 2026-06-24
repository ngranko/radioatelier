import {v} from 'convex/values';
import {internal} from '../_generated/api';
import type {Id} from '../_generated/dataModel';
import {type ActionCtx, internalAction} from '../_generated/server';
import {
    archivePage,
    createPage,
    retrieveDataSource,
    retrievePage,
    updatePage,
} from '../notion/client';
import {getNotionDataSourceId} from '../notion/config';
import {buildNotionPropertiesPayload, readNotionPageFields} from '../notion/fields';
import type {NotionDataSource} from '../notion/types';
import {computeAppToNotionDiff} from './reconcile';
import type {ObjectSyncSnapshot} from './snapshot';
import {buildSyncStateArgs, needsSyncStateWrite} from './state';
import type {AppSyncFields} from './types';

type OutboundBatchResult = {
    synced: number;
    skipped: number;
    failed: number;
};

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
        return await performOutboundObjectSyncBatch(ctx, objectIds);
    },
});

export const enqueueOutboundObjectSyncBatchLenient = internalAction({
    args: {
        objectIds: v.array(v.id('objects')),
    },
    handler: async (ctx, {objectIds}) => {
        return await performOutboundObjectSyncBatchLenient(ctx, objectIds);
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

export async function performOutboundObjectSync(
    ctx: ActionCtx,
    objectId: Id<'objects'>,
): Promise<string | null> {
    const snapshot = (await ctx.runQuery(internal.notionSync.snapshot.getObjectSnapshot, {
        objectId,
    })) as ObjectSyncSnapshot | null;
    if (!snapshot?.owner.notionSyncEnabled) {
        return null;
    }

    try {
        const dataSource = await retrieveDataSource(getNotionDataSourceId());
        const notionPageId = snapshot.sync?.notionPageId ?? null;
        if (!notionPageId) {
            return await createNotionPageForSyncedObject(ctx, objectId, dataSource, snapshot);
        }
        return await updateSyncedNotionPage(ctx, objectId, dataSource, notionPageId, snapshot);
    } catch (error) {
        await ctx.runMutation(internal.notionSync.state.patchSyncState, {
            objectId,
            message: error instanceof Error ? error.message : 'Unknown Notion sync error',
        });
        throw error;
    }
}

export async function performOutboundObjectSyncBatch(
    ctx: ActionCtx,
    objectIds: Id<'objects'>[],
): Promise<OutboundBatchResult> {
    const result: OutboundBatchResult = {synced: 0, skipped: 0, failed: 0};
    const uniqueObjectIds = [...new Set(objectIds)];

    for (const objectId of uniqueObjectIds) {
        const notionPageId = await performOutboundObjectSync(ctx, objectId);
        if (notionPageId) {
            result.synced += 1;
        } else {
            result.skipped += 1;
        }
    }

    return result;
}

export async function performOutboundObjectSyncBatchLenient(
    ctx: ActionCtx,
    objectIds: Id<'objects'>[],
): Promise<OutboundBatchResult> {
    const result: OutboundBatchResult = {synced: 0, skipped: 0, failed: 0};
    const uniqueObjectIds = [...new Set(objectIds)];

    for (const objectId of uniqueObjectIds) {
        try {
            const notionPageId = await performOutboundObjectSync(ctx, objectId);
            if (notionPageId) {
                result.synced += 1;
            } else {
                result.skipped += 1;
            }
        } catch (error) {
            result.failed += 1;
            console.error('[Notion sync] Failed to sync object from batch', {
                objectId,
                error: error instanceof Error ? error.message : error,
            });
        }
    }

    return result;
}

async function createNotionPageForSyncedObject(
    ctx: ActionCtx,
    objectId: Id<'objects'>,
    dataSource: NotionDataSource,
    snapshot: ObjectSyncSnapshot,
) {
    const page = await createPage(
        dataSource.id,
        buildNotionPropertiesPayload(dataSource, snapshot.fields),
    );
    await recordOutboundSynced(
        ctx,
        objectId,
        page.id,
        snapshot.fields,
        page.last_edited_time ?? null,
        snapshot.sync,
    );
    return page.id;
}

async function updateSyncedNotionPage(
    ctx: ActionCtx,
    objectId: Id<'objects'>,
    dataSource: NotionDataSource,
    notionPageId: string,
    snapshot: ObjectSyncSnapshot,
) {
    const notionPage = await retrievePage(notionPageId);
    const notionFields = readNotionPageFields(notionPage);
    const {notionPatch} = computeAppToNotionDiff(snapshot.fields, notionFields);
    let syncedPage = notionPage;
    if (Object.keys(notionPatch).length > 0) {
        syncedPage = await updatePage(
            notionPageId,
            buildNotionPropertiesPayload(dataSource, notionPatch),
        );
    }
    await recordOutboundSynced(
        ctx,
        objectId,
        notionPageId,
        snapshot.fields,
        syncedPage.last_edited_time ?? null,
        snapshot.sync,
    );
    return notionPageId;
}

async function recordOutboundSynced(
    ctx: ActionCtx,
    objectId: Id<'objects'>,
    notionPageId: string,
    fields: AppSyncFields,
    notionLastEditedTime: string | null,
    existingSync: ObjectSyncSnapshot['sync'],
) {
    const syncStateArgs = buildSyncStateArgs(
        {
            kind: 'outboundSynced',
            objectId,
            notionPageId,
            fields,
            notionLastEditedTime,
        },
        Date.now(),
    );
    if (!needsSyncStateWrite(existingSync, syncStateArgs)) {
        return;
    }
    await ctx.runMutation(internal.notionSync.state.upsertSyncState, syncStateArgs);
}
