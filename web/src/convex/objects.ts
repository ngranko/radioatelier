import {query} from './_generated/server';
import {Doc} from './_generated/dataModel';
import {v} from 'convex/values';
import {getCurrentUser} from './users';
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
        const tags = fetchedTags.filter(tag => tag !== null);

        let privateTags: Doc<'privateTags'>[] = [];
        let isVisited = false;
        if (user) {
            const objectPrivateTags = await ctx.db
                .query('objectPrivateTags')
                .withIndex('byObjectIdAndPrivateTagId', q => q.eq('objectId', id))
                .collect();
            const fetchedPrivateTags = await Promise.all(
                objectPrivateTags.map(async item => ctx.db.get('privateTags', item.privateTagId)),
            );
            privateTags = fetchedPrivateTags.filter(
                (item): item is Doc<'privateTags'> =>
                    item !== null && item.createdById === user._id,
            );

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
