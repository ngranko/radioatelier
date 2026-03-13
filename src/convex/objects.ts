import {paginationOptsValidator} from 'convex/server';
import {v} from 'convex/values';
import {internal} from './_generated/api';
import type {Doc} from './_generated/dataModel';
import {internalQuery, mutation, query} from './_generated/server';
import {
    getIsVisited,
    getNextInternalId,
    getPrivateTags,
    updateIsVisited,
} from './helpers/objectHelpers';
import {
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
        };
    },
});

export const create = mutation({
    args: {
        data: v.object(createObjectRecordFields),
    },
    handler: async (ctx, {data}) => {
        const user = await getCurrentUserOrThrow(ctx);

        const mapPointId = await ctx.db.insert('mapPoints', {
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address ?? '',
            city: data.city ?? '',
            country: data.country ?? '',
        });

        const objectId = await ctx.db.insert('objects', {
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
            internalId: await getNextInternalId(ctx),
            mapPointId,
            createdById: user._id,
        });

        await ctx.db.insert('objectPrivateTags', {
            objectId,
            privateTagIds: data.privateTags,
            userId: user._id,
        });

        if (data.isVisited) {
            updateIsVisited(ctx, objectId, user._id, true);
        }

        await ctx.db.insert('markers', {
            objectId,
            latitude: data.latitude,
            longitude: data.longitude,
            createdById: user._id,
            categoryId: data.categoryId,
            tagIds: data.tagIds,
            isRemoved: data.isRemoved,
            isPublic: data.isPublic,
        });

        const category = await ctx.db.get('categories', data.categoryId);
        if (!category) {
            throw new Error('Category not found');
        }

        ctx.scheduler.runAfter(0, internal.typesense.createInTypesense, {
            object: {
                id: objectId,
                name: data.name,
                address: data.address ?? null,
                city: data.city ?? null,
                country: data.country ?? null,
                categoryName: category.name,
                location: [data.latitude, data.longitude] as [number, number],
                createdBy: user._id,
                isPublic: data.isPublic,
            },
        });

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

        const object = await ctx.db.get('objects', id);
        if (!object) {
            throw new Error('Object not found');
        }
        const mapPoint = await ctx.db.get('mapPoints', object.mapPointId);
        if (!mapPoint) {
            throw new Error('Map point not found');
        }

        const isOwner = object.createdById === user._id;
        if (!isOwner && !object.isPublic) {
            throw new Error('Not allowed to update this object');
        }

        if (isOwner) {
            const objectPatch: Record<string, unknown> = {
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
            };
            await ctx.db.patch('objects', id, objectPatch);

            await ctx.db.patch('mapPoints', object.mapPointId, {
                address: data.address ?? '',
                city: data.city ?? '',
                country: data.country ?? '',
            });

            const marker = await ctx.db
                .query('markers')
                .withIndex('byObjectId', q => q.eq('objectId', id))
                .first();
            if (marker) {
                await ctx.db.patch('markers', marker._id, {
                    categoryId: data.categoryId,
                    tagIds: data.tagIds,
                    isRemoved: data.isRemoved,
                    isPublic: data.isPublic,
                });
            }
        }

        const privateTagsRecord = await ctx.db
            .query('objectPrivateTags')
            .withIndex('byObjectIdUserId', q => q.eq('objectId', id).eq('userId', user._id))
            .first();
        if (privateTagsRecord) {
            await ctx.db.patch('objectPrivateTags', privateTagsRecord._id, {
                privateTagIds: data.privateTags,
            });
        } else {
            await ctx.db.insert('objectPrivateTags', {
                objectId: id,
                userId: user._id,
                privateTagIds: data.privateTags,
            });
        }

        updateIsVisited(ctx, id, user._id, data.isVisited);

        const category = await ctx.db.get('categories', data.categoryId);
        if (!category) {
            throw new Error('Category not found');
        }

        ctx.scheduler.runAfter(0, internal.typesense.createInTypesense, {
            object: {
                id,
                name: data.name,
                address: data.address ?? null,
                city: data.city ?? null,
                country: data.country ?? null,
                categoryName: category.name,
                location: [mapPoint.latitude, mapPoint.longitude] as [number, number],
                createdBy: user._id,
                isPublic: data.isPublic,
            },
        });

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

        const marker = await ctx.db
            .query('markers')
            .withIndex('byObjectId', q => q.eq('objectId', id))
            .first();
        if (marker) {
            await ctx.db.delete('markers', marker._id);
        }

        const privateTagRows = await ctx.db
            .query('objectPrivateTags')
            .withIndex('byObjectIdUserId', q => q.eq('objectId', id))
            .collect();
        for (const row of privateTagRows) {
            await ctx.db.delete('objectPrivateTags', row._id);
        }

        updateIsVisited(ctx, id, user._id, false);

        await ctx.db.delete('mapPoints', object.mapPointId);
        await ctx.db.delete('objects', id);

        ctx.scheduler.runAfter(0, internal.typesense.removeFromTypesense, {
            objectId: id,
        });
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

        const object = await ctx.db.get('objects', id);
        if (!object) {
            throw new Error('Object not found');
        }
        if (object.createdById !== user._id) {
            throw new Error('Not allowed to update this object');
        }

        const mapPoint = await ctx.db.get('mapPoints', object.mapPointId);
        if (!mapPoint) {
            throw new Error('Map point not found');
        }

        const marker = await ctx.db
            .query('markers')
            .withIndex('byObjectId', q => q.eq('objectId', id))
            .first();
        if (!marker) {
            throw new Error('Marker not found');
        }

        await ctx.db.patch('mapPoints', object.mapPointId, {
            latitude: data.latitude,
            longitude: data.longitude,
        });

        await ctx.db.patch('markers', marker._id, {
            latitude: data.latitude,
            longitude: data.longitude,
        });

        const category = await ctx.db.get('categories', object.categoryId);
        if (!category) {
            throw new Error('Category not found');
        }

        ctx.scheduler.runAfter(0, internal.typesense.updateInTypesense, {
            object: {
                id,
                name: object.name,
                address: mapPoint.address ?? null,
                city: mapPoint.city ?? null,
                country: mapPoint.country ?? null,
                categoryName: category.name,
                createdBy: object.createdById,
                isPublic: object.isPublic,
                location: [data.latitude, data.longitude] as [number, number],
            },
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
                    id: object._id,
                    name: object.name,
                    address: mapPoint.address,
                    city: mapPoint.city,
                    country: mapPoint.country,
                    categoryName: category.name,
                    location: [mapPoint.latitude, mapPoint.longitude] as [number, number],
                    createdBy: object.createdById,
                    isPublic: object.isPublic,
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
