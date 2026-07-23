import {paginationOptsValidator} from 'convex/server';
import {v} from 'convex/values';
import {internal} from './_generated/api';
import type {Doc, Id} from './_generated/dataModel';
import {internalQuery, mutation, query, type QueryCtx} from './_generated/server';
import {buildObjectSearchRecord, deleteObjectAggregate} from './helpers/objectAggregate';
import {
    buildObjectDetails,
    type ObjectCover,
    type ObjectViewerContext,
} from './helpers/objectDetails';
import {getIsVisited, getPrivateTags, updateIsVisited} from './helpers/objectHelpers';
import {loadObjectAggregate, loadObjectAggregates} from './helpers/objectReader';
import {
    createObjectRecords,
    loadObjectTarget,
    patchObjectRecords,
    replaceObjectRecords,
    upsertPrivateTags,
} from './helpers/objectWriter';
import {deleteSyncStateForObject} from './notionSync/state';
import {
    assertValidMapPointCoordinates,
    createObjectRecordFields,
    repositionObjectRecordFields,
    updateObjectRecordFields,
} from './sharedValidators';
import {getCurrentUser, getCurrentUserOrThrow} from './users';

export const getDetails = query({
    args: {
        id: v.id('objects'),
    },
    handler: async (ctx, {id}) => {
        // `/object/:id` doubles as the shared-object entry point, so this read stays anonymous.
        const user = await getCurrentUser(ctx);

        const object = await ctx.db.get('objects', id);
        if (!object) {
            throw new Error('Object not found');
        }
        const aggregate = await loadObjectAggregate(ctx, object);
        if (!aggregate) {
            throw new Error('Object relations not found');
        }

        return buildObjectDetails(aggregate, await loadViewerContext(ctx, object, user));
    },
});

async function loadViewerContext(
    ctx: QueryCtx,
    object: Doc<'objects'>,
    user: Doc<'users'> | null,
): Promise<ObjectViewerContext> {
    let privateTags: Doc<'privateTags'>[] = [];
    let isVisited = false;
    if (user) {
        [privateTags, isVisited] = await Promise.all([
            getPrivateTags(ctx, object._id, user._id),
            getIsVisited(ctx, object._id, user._id),
        ]);
    }
    return {
        userId: user?._id ?? null,
        privateTags,
        isVisited,
        cover: await loadCover(ctx, object.coverId),
    };
}

async function loadCover(ctx: QueryCtx, coverId: Id<'images'> | null): Promise<ObjectCover | null> {
    if (!coverId) {
        return null;
    }
    const image = await ctx.db.get('images', coverId);
    if (!image) {
        return null;
    }
    const [url, previewUrl] = await Promise.all([
        image.originalStorageId ? ctx.storage.getUrl(image.originalStorageId) : null,
        image.previewStorageId ? ctx.storage.getUrl(image.previewStorageId) : null,
    ]);
    return {
        id: image._id,
        url: url ?? '',
        previewUrl: previewUrl ?? '',
    };
}

export const resolveShareId = query({
    args: {
        id: v.string(),
    },
    handler: async (ctx, {id}) => {
        const canonicalId = ctx.db.normalizeId('objects', id);
        if (canonicalId) {
            return {
                canonicalId,
                shouldRedirect: false,
            };
        }

        const object = await ctx.db
            .query('objects')
            .withIndex('byMysqlId', q => q.eq('mysqlId', id))
            .unique();
        if (!object) {
            return null;
        }

        return {
            canonicalId: object._id,
            shouldRedirect: true,
        };
    },
});

export const create = mutation({
    args: {
        data: v.object(createObjectRecordFields),
    },
    handler: async (ctx, {data}) => {
        const user = await getCurrentUserOrThrow(ctx);
        assertValidMapPointCoordinates(data.latitude, data.longitude);

        const {objectId} = await createObjectRecords(ctx, user._id, {
            name: data.name,
            description: data.description ?? null,
            installedPeriod: data.installedPeriod ?? null,
            removalPeriod: data.removalPeriod ?? null,
            source: data.source ?? null,
            coverId: data.coverId ?? null,
            categoryId: data.categoryId,
            tagIds: data.tagIds,
            isPublic: data.isPublic,
            isRemoved: data.isRemoved,
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address ?? '',
            city: data.city ?? '',
            country: data.country ?? '',
        });

        await upsertPrivateTags(ctx, objectId, user._id, data.privateTags);
        if (data.isVisited) {
            await updateIsVisited(ctx, objectId, user._id, true);
        }

        if (user.notionSyncEnabled) {
            await ctx.scheduler.runAfter(
                0,
                internal.notionSync.outbound.enqueueOutboundObjectSync,
                {
                    objectId,
                },
            );
        }

        return objectId;
    },
});

export const update = mutation({
    args: {
        id: v.id('objects'),
        data: v.object(updateObjectRecordFields),
    },
    handler: async (ctx, {id, data}) => {
        const user = await getCurrentUserOrThrow(ctx);

        const target = await loadObjectTarget(ctx, id);

        const isOwner = target.object.createdById === user._id;
        if (!isOwner && !target.object.isPublic) {
            throw new Error('Not allowed to update this object');
        }

        if (isOwner) {
            await replaceObjectRecords(ctx, target, {
                name: data.name,
                description: data.description,
                coverId: data.coverId,
                categoryId: data.categoryId,
                tagIds: data.tagIds,
                isPublic: data.isPublic,
                isRemoved: data.isRemoved,
                installedPeriod: data.installedPeriod,
                removalPeriod: data.removalPeriod,
                source: data.source,
                address: data.address ?? '',
                city: data.city ?? '',
                country: data.country ?? '',
            });

            // Non-owners only touch per-user state (private tags, visited), so
            // outbound sync stays untouched for them.
            if (user.notionSyncEnabled) {
                await ctx.scheduler.runAfter(
                    0,
                    internal.notionSync.outbound.enqueueOutboundObjectSync,
                    {
                        objectId: id,
                    },
                );
            }
        }

        await upsertPrivateTags(ctx, id, user._id, data.privateTags);
        await updateIsVisited(ctx, id, user._id, data.isVisited);

        return id;
    },
});

export const remove = mutation({
    args: {id: v.id('objects')},
    handler: async (ctx, {id}) => {
        const user = await getCurrentUserOrThrow(ctx);

        const object = await ctx.db.get('objects', id);
        if (!object) {
            throw new Error('Object not found');
        }
        if (object.createdById !== user._id) {
            throw new Error('Only the owner can delete this object');
        }
        const notionSyncRecord = await deleteSyncStateForObject(ctx, id);
        await deleteObjectAggregate(ctx, object);

        await ctx.scheduler.runAfter(0, internal.typesense.removeFromTypesense, {
            objectId: id,
        });
        if (user.notionSyncEnabled && notionSyncRecord) {
            await ctx.scheduler.runAfter(0, internal.notionSync.outbound.archiveDeletedObjectPage, {
                objectId: id,
                notionPageId: notionSyncRecord.notionPageId,
            });
        }
        return id;
    },
});

export const reposition = mutation({
    args: {
        id: v.id('objects'),
        data: v.object(repositionObjectRecordFields),
    },
    handler: async (ctx, {id, data}) => {
        const user = await getCurrentUserOrThrow(ctx);
        assertValidMapPointCoordinates(data.latitude, data.longitude);

        const target = await loadObjectTarget(ctx, id);
        if (target.object.createdById !== user._id) {
            throw new Error('Not allowed to update this object');
        }

        await patchObjectRecords(ctx, target, {
            latitude: data.latitude,
            longitude: data.longitude,
        });
    },
});

export const listForTypesenseBackfill = internalQuery({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, {paginationOpts}) => {
        const result = await ctx.db.query('objects').order('desc').paginate(paginationOpts);
        const aggregates = await loadObjectAggregates(ctx, result.page);
        const items = result.page.map(object => {
            const aggregate = aggregates.get(object._id);
            if (!aggregate) {
                throw new Error(`Object relations not found for object ${object._id}`);
            }
            return buildObjectSearchRecord({
                id: object._id,
                name: object.name,
                mapPoint: aggregate.mapPoint,
                categoryName: aggregate.category.name,
                createdBy: object.createdById,
                isPublic: object.isPublic,
            });
        });

        return {
            isDone: result.isDone,
            continueCursor: result.continueCursor,
            page: items,
        };
    },
});
