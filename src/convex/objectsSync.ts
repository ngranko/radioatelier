import {v} from 'convex/values';
import {internal} from './_generated/api';
import type {Id} from './_generated/dataModel';
import {internalMutation, type MutationCtx} from './_generated/server';
import {deleteObjectAggregate} from './helpers/objectAggregate';
import {updateIsVisited} from './helpers/objectHelpers';
import {
    createObjectRecords,
    loadObjectTarget,
    patchObjectRecords,
    upsertPrivateTags,
} from './helpers/objectWriter';
import {
    buildPatchedFields,
    buildSyncCreateData,
    buildSyncRecordPatch,
    resolveCreateClassification,
    resolvePatchClassification,
} from './notionSync/objectWriterAdapter';
import {scheduleCreateSearch, scheduleUpdateSearch} from './notionSync/objectWriterSearch';
import type {CreateSyncedObjectInput, PatchSyncedObjectInput} from './notionSync/objectWriterTypes';
import {
    buildSyncStateArgs,
    deleteSyncStateForObject,
    upsertSyncStateInMutation,
} from './notionSync/state';
import {appPatchValidator, notionFieldsValidator, nullableString} from './notionSync/types';

export const createObjectFromSync = internalMutation({
    args: {
        notionPageId: v.string(),
        ownerId: v.id('users'),
        latitude: v.number(),
        longitude: v.number(),
        fields: v.object(notionFieldsValidator),
        lastInboundEditedTime: nullableString,
    },
    handler: async (
        ctx,
        {notionPageId, ownerId, latitude, longitude, fields, lastInboundEditedTime},
    ) => {
        return await createSyncedObject(ctx, {
            notionPageId,
            ownerId,
            latitude,
            longitude,
            fields,
            lastInboundEditedTime,
        });
    },
});

export const patchObjectFromSync = internalMutation({
    args: {
        objectId: v.id('objects'),
        notionPageId: v.string(),
        patch: v.object(appPatchValidator),
        lastInboundEditedTime: nullableString,
    },
    handler: async (ctx, {objectId, notionPageId, patch, lastInboundEditedTime}) => {
        return await patchSyncedObject(ctx, {
            objectId,
            notionPageId,
            patch,
            lastInboundEditedTime,
        });
    },
});

async function createSyncedObject(ctx: MutationCtx, input: CreateSyncedObjectInput) {
    await requireActiveOwner(ctx, input.ownerId);
    const classification = await resolveCreateClassification(ctx, input);
    const {objectId} = await createObjectRecords(
        ctx,
        input.ownerId,
        buildSyncCreateData(input, classification),
    );

    await upsertPrivateTags(ctx, objectId, input.ownerId, []);
    await updateIsVisited(ctx, objectId, input.ownerId, input.fields.isVisited);
    await scheduleCreateSearch(ctx, input, classification.categoryName, objectId);
    await recordInboundSync(ctx, objectId, input.notionPageId, input.lastInboundEditedTime);
    return objectId;
}

async function patchSyncedObject(ctx: MutationCtx, input: PatchSyncedObjectInput) {
    const target = await loadObjectTarget(ctx, input.objectId);
    const classification = await resolvePatchClassification(ctx, target, input);

    await patchObjectRecords(ctx, target, buildSyncRecordPatch(input.patch, classification));
    if (input.patch.isVisited !== undefined) {
        await updateIsVisited(
            ctx,
            target.object._id,
            target.object.createdById,
            input.patch.isVisited,
        );
    }
    await scheduleUpdateSearch(ctx, input, target, classification.categoryName);
    const nextFields = await buildPatchedFields(ctx, target, input, classification);
    await recordInboundSync(ctx, input.objectId, input.notionPageId, input.lastInboundEditedTime);
    return nextFields;
}

async function deleteSyncedObject(ctx: MutationCtx, objectId: Id<'objects'>) {
    const object = await ctx.db.get('objects', objectId);
    if (!object) {
        return null;
    }
    await deleteSyncStateForObject(ctx, objectId);
    await deleteObjectAggregate(ctx, object);
    await ctx.scheduler.runAfter(0, internal.typesense.removeFromTypesense, {objectId});
    return null;
}

async function requireActiveOwner(ctx: MutationCtx, ownerId: Id<'users'>) {
    const owner = await ctx.db.get('users', ownerId);
    if (!owner || owner.isDeleted) {
        throw new Error('Owner not found');
    }
}

async function recordInboundSync(
    ctx: MutationCtx,
    objectId: Id<'objects'>,
    notionPageId: string,
    lastInboundEditedTime: string | null,
) {
    await upsertSyncStateInMutation(
        ctx,
        buildSyncStateArgs(
            {
                kind: 'inboundApplied',
                objectId,
                notionPageId,
                notionLastEditedTime: lastInboundEditedTime,
            },
            Date.now(),
        ),
    );
}

export const deleteObjectFromSync = internalMutation({
    args: {
        objectId: v.id('objects'),
    },
    handler: async (ctx, {objectId}) => {
        return await deleteSyncedObject(ctx, objectId);
    },
});
