import {v} from 'convex/values';
import {Doc} from './_generated/dataModel';
import {mutation, query} from './_generated/server';
import {createObjectLocationFields} from './sharedValidators';
import {getCurrentUser, getCurrentUserOrThrow} from './users';
import {getVisitedChunkId} from './utils/visitedChunks';

export const getDetails = query({
    args: {
        id: v.id('objects'),
    },
    handler: async (ctx, {id}) => {
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
            const objectPrivateTags = await ctx.db
                .query('objectPrivateTags')
                .withIndex('byObjectIdUserId', q => q.eq('objectId', id).eq('userId', user._id))
                .first();
            privateTags =
                (
                    await Promise.all(
                        objectPrivateTags?.privateTagIds.map(async item =>
                            ctx.db.get('privateTags', item),
                        ) ?? [],
                    )
                ).filter((tag): tag is Doc<'privateTags'> => tag !== null) ?? [];

            const chunkId = getVisitedChunkId(object._id);
            const visitedData = await ctx.db
                .query('userVisitedChunks')
                .withIndex('byUserIdAndChunkId', q =>
                    q.eq('userId', user._id).eq('chunkId', chunkId),
                )
                .unique();
            if (visitedData) {
                isVisited = visitedData.visitedObjectIds.includes(object._id);
            }
        }

        let cover = null;
        if (object.coverId) {
            cover = await ctx.db.get('images', object.coverId);
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
            cover: cover
                ? {
                      id: cover._id,
                      url: cover.url,
                      previewUrl: cover.previewUrl ?? '',
                  }
                : null,
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

const createDataValidator = {
    ...createObjectLocationFields,
    name: v.string(),
    description: v.union(v.string(), v.null()),
    installedPeriod: v.union(v.string(), v.null()),
    removalPeriod: v.union(v.string(), v.null()),
    source: v.union(v.string(), v.null()),
    coverId: v.union(v.id('images'), v.null()),
    categoryId: v.id('categories'),
    tagIds: v.array(v.id('tags')),
    isPublic: v.boolean(),
    isRemoved: v.boolean(),
    internalId: v.optional(v.string()),
    privateTags: v.array(v.id('privateTags')),
    isVisited: v.boolean(),
};

export const create = mutation({
    args: {
        data: v.object(createDataValidator),
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
            internalId: data.internalId ?? `temp-${Date.now()}`,
            mapPointId,
            createdById: user._id,
        });

        await ctx.db.insert('objectPrivateTags', {
            objectId,
            privateTagIds: data.privateTags,
            userId: user._id,
        });

        if (data.isVisited) {
            const chunkId = getVisitedChunkId(objectId);
            const visitedData = await ctx.db
                .query('userVisitedChunks')
                .withIndex('byUserIdAndChunkId', q =>
                    q.eq('userId', user._id).eq('chunkId', chunkId),
                )
                .unique();
            if (visitedData) {
                visitedData.visitedObjectIds.push(objectId);
                await ctx.db.patch('userVisitedChunks', visitedData._id, {
                    visitedObjectIds: [...visitedData.visitedObjectIds, objectId],
                });
            } else {
                await ctx.db.insert('userVisitedChunks', {
                    userId: user._id,
                    chunkId,
                    visitedObjectIds: [objectId],
                });
            }
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

        return objectId;
    },
});

const updateDataValidator = {
    name: v.string(),
    description: v.union(v.string(), v.null()),
    coverId: v.union(v.id('images'), v.null()),
    categoryId: v.id('categories'),
    tagIds: v.array(v.id('tags')),
    privateTags: v.array(v.id('privateTags')),
    isPublic: v.boolean(),
    isVisited: v.boolean(),
    isRemoved: v.boolean(),
    latitude: v.number(),
    longitude: v.number(),
    address: v.union(v.string(), v.null()),
    city: v.union(v.string(), v.null()),
    country: v.union(v.string(), v.null()),
    installedPeriod: v.union(v.string(), v.null()),
    removalPeriod: v.union(v.string(), v.null()),
    source: v.union(v.string(), v.null()),
};

export const updateFull = mutation({
    args: {
        id: v.id('objects'),
        data: v.object(updateDataValidator),
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
                latitude: data.latitude,
                longitude: data.longitude,
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
                    latitude: data.latitude,
                    longitude: data.longitude,
                    categoryId: data.categoryId,
                    tagIds: data.tagIds,
                    isRemoved: data.isRemoved,
                    isPublic: data.isPublic,
                });
            }
        }

        const existingOpt = await ctx.db
            .query('objectPrivateTags')
            .withIndex('byObjectIdUserId', q => q.eq('objectId', id).eq('userId', user._id))
            .first();
        if (existingOpt) {
            await ctx.db.patch('objectPrivateTags', existingOpt._id, {
                privateTagIds: data.privateTags,
            });
        } else {
            await ctx.db.insert('objectPrivateTags', {
                objectId: id,
                userId: user._id,
                privateTagIds: data.privateTags,
            });
        }

        const chunkId = getVisitedChunkId(id);
        const visitedData = await ctx.db
            .query('userVisitedChunks')
            .withIndex('byUserIdAndChunkId', q => q.eq('userId', user._id).eq('chunkId', chunkId))
            .unique();
        const wasVisited = visitedData?.visitedObjectIds.includes(id) ?? false;
        if (data.isVisited && !wasVisited) {
            if (visitedData) {
                await ctx.db.patch('userVisitedChunks', visitedData._id, {
                    visitedObjectIds: [...visitedData.visitedObjectIds, id],
                });
            } else {
                await ctx.db.insert('userVisitedChunks', {
                    userId: user._id,
                    chunkId,
                    visitedObjectIds: [id],
                });
            }
        } else if (!data.isVisited && wasVisited && visitedData) {
            const newIds = visitedData.visitedObjectIds.filter(oid => oid !== id);
            if (newIds.length === 0) {
                await ctx.db.delete('userVisitedChunks', visitedData._id);
            } else {
                await ctx.db.patch('userVisitedChunks', visitedData._id, {
                    visitedObjectIds: newIds,
                });
            }
        }

        return id;
    },
});

export const update = mutation({
    args: {
        id: v.id('objects'),
        data: v.object({
            name: v.string(),
        }),
    },
    handler: async (ctx, {id, data}) => {
        return await ctx.db.patch('objects', id, data);
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

        const chunkId = getVisitedChunkId(id);
        const visitedData = await ctx.db
            .query('userVisitedChunks')
            .withIndex('byUserIdAndChunkId', q => q.eq('userId', user._id).eq('chunkId', chunkId))
            .unique();
        if (visitedData) {
            const newIds = visitedData.visitedObjectIds.filter(oid => oid !== id);
            if (newIds.length === 0) {
                await ctx.db.delete('userVisitedChunks', visitedData._id);
            } else {
                await ctx.db.patch('userVisitedChunks', visitedData._id, {
                    visitedObjectIds: newIds,
                });
            }
        }

        await ctx.db.delete('objects', id);
        await ctx.db.delete('mapPoints', object.mapPointId);
        return id;
    },
});
