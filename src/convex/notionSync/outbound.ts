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
            await performOutboundObjectSync(ctx, objectId);
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
