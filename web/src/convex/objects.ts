import {v} from 'convex/values';
import {Doc} from './_generated/dataModel';
import {mutation, query} from './_generated/server';
import {createObjectLocationFields, createObjectRecordFields} from './sharedValidators';
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

export const create = mutation({
    args: {
        data: v.object({
            ...createObjectLocationFields,
            ...createObjectRecordFields,
            privateTags: v.array(v.id('privateTags')),
            isVisited: v.boolean(),
        }),
    },
    handler: async (ctx, {data}) => {
        const user = await getCurrentUserOrThrow(ctx);

        const mapPointId = await ctx.db.insert('mapPoints', {
            latitude: data.latitude,
            longitude: data.longitude,
            address: data.address,
            city: data.city,
            country: data.country,
        });

        const objectId = await ctx.db.insert('objects', {
            ...data,
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
