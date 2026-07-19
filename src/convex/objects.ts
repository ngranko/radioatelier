import {paginationOptsValidator} from 'convex/server';
import {v} from 'convex/values';
import {internal} from './_generated/api';
import type {Doc} from './_generated/dataModel';
import {internalQuery, mutation, query} from './_generated/server';
import {buildObjectSearchRecord, deleteObjectAggregate} from './helpers/objectAggregate';
import {getIsVisited, getPrivateTags, updateIsVisited} from './helpers/objectHelpers';
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

        const mapPoint = await ctx.db.get('mapPoints', object.mapPointId);
        if (!mapPoint) {
            throw new Error('Map point not found');
        }

        const category = await ctx.db.get('categories', object.categoryId);
        if (!category) {
            throw new Error('Category not found');
        }

        const fetchedTags = await Promise.all(
            object.tagIds.map(async item => ctx.db.get('tags', item)),
        );
        const tags = fetchedTags.filter((tag): tag is Doc<'tags'> => tag !== null);

        let privateTags: Doc<'privateTags'>[] = [];
        let isVisited = false;
        if (user) {
            privateTags = await getPrivateTags(ctx, object._id, user._id);
            isVisited = await getIsVisited(ctx, object._id, user._id);
        }

        let cover = null;
        if (object.coverId) {
            const image = await ctx.db.get('images', object.coverId);
            if (image) {
                cover = {
                    id: image._id,
                    url: '',
                    previewUrl: '',
                };
                if (image.originalStorageId) {
                    cover.url = (await ctx.storage.getUrl(image.originalStorageId)) ?? '';
                }
                if (image.previewStorageId) {
                    cover.previewUrl = (await ctx.storage.getUrl(image.previewStorageId)) ?? '';
                }
            }
        }

        return {
            id: object._id,
            latitude: mapPoint.latitude,
            longitude: mapPoint.longitude,
            name: object.name,
            description: object.description,
            address: mapPoint.address,
            city: mapPoint.city,
            country: mapPoint.country,
            installedPeriod: object.installedPeriod,
            isRemoved: object.isRemoved,
            removalPeriod: object.removalPeriod,
            source: object.source,
            cover,
            isPublic: object.isPublic,
            category: {
                id: category._id,
                name: category.name,
            },
            tags: tags.map(tag => ({
                id: tag._id,
                name: tag.name,
            })),
            privateTags: privateTags.map(tag => ({
                id: tag._id,
                name: tag.name,
            })),
            isVisited,
            isOwner: object.createdById === user?._id,
            internalId: user ? object.internalId : null,
        };
    },
});

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

        const category = await ctx.db.get('categories', data.categoryId);
        if (!category) {
            throw new Error('Category not found');
        }

        await ctx.scheduler.runAfter(0, internal.typesense.createInTypesense, {
            object: buildObjectSearchRecord({
                id: objectId,
                name: data.name,
                mapPoint: {
                    latitude: data.latitude,
                    longitude: data.longitude,
                    address: data.address ?? null,
                    city: data.city ?? null,
                    country: data.country ?? null,
                },
                categoryName: category.name,
                createdBy: user._id,
                isPublic: data.isPublic,
            }),
        });
        if (user.notionSyncEnabled) {
            await ctx.scheduler.runAfter(0, internal.notionSync.outbound.enqueueOutboundObjectSync, {
                objectId,
            });
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

            const category = await ctx.db.get('categories', data.categoryId);
            if (!category) {
                throw new Error('Category not found');
            }

            // Non-owners only touch per-user state (private tags, visited), so
            // the search record and outbound sync stay untouched for them.
            await ctx.scheduler.runAfter(0, internal.typesense.updateInTypesense, {
                object: buildObjectSearchRecord({
                    id,
                    name: data.name,
                    mapPoint: {
                        latitude: target.mapPoint.latitude,
                        longitude: target.mapPoint.longitude,
                        address: data.address ?? null,
                        city: data.city ?? null,
                        country: data.country ?? null,
                    },
                    categoryName: category.name,
                    createdBy: target.object.createdById,
                    isPublic: data.isPublic,
                }),
            });
            if (user.notionSyncEnabled) {
                await ctx.scheduler.runAfter(0, internal.notionSync.outbound.enqueueOutboundObjectSync, {
                    objectId: id,
                });
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

        await ctx.scheduler.runAfter(0, internal.typesense.updateInTypesense, {
            object: buildObjectSearchRecord({
                id,
                name: target.object.name,
                mapPoint: {
                    ...target.mapPoint,
                    latitude: data.latitude,
                    longitude: data.longitude,
                },
                categoryName: target.category.name,
                createdBy: target.object.createdById,
                isPublic: target.object.isPublic,
            }),
        });
    },
});

export const listForTypesenseBackfill = internalQuery({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, {paginationOpts}) => {
        const result = await ctx.db.query('objects').order('desc').paginate(paginationOpts);
        const items = await Promise.all(
            result.page.map(async object => {
                const [mapPoint, category] = await Promise.all([
                    ctx.db.get('mapPoints', object.mapPointId),
                    ctx.db.get('categories', object.categoryId),
                ]);

                if (!mapPoint) {
                    throw new Error(`Map point not found for object ${object._id}`);
                }

                if (!category) {
                    throw new Error(`Category not found for object ${object._id}`);
                }

                return {
                    ...buildObjectSearchRecord({
                        id: object._id,
                        name: object.name,
                        mapPoint,
                        categoryName: category.name,
                        createdBy: object.createdById,
                        isPublic: object.isPublic,
                    }),
                };
            }),
        );

        return {
            isDone: result.isDone,
            continueCursor: result.continueCursor,
            page: items,
        };
    },
});
