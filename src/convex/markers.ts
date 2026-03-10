import type {Id} from './_generated/dataModel';
import {query} from './_generated/server';
import {getCurrentUserOrThrow} from './users';

export const list = query({
    args: {},
    handler: async ctx => {
        const user = await getCurrentUserOrThrow(ctx);

        const userMarkers = await ctx.db
            .query('markers')
            .withIndex('byCreatedByIdAndIsPublic', q =>
                q.eq('createdById', user._id).eq('isPublic', false),
            )
            .collect();

        const publicMarkers = await ctx.db
            .query('markers')
            .withIndex('byIsPublic', q => q.eq('isPublic', true))
            .collect();

        const visitedData = await ctx.db
            .query('userVisitedChunks')
            .withIndex('byUserIdAndChunkId', q => q.eq('userId', user._id))
            .collect();

        const visitedMarkers = visitedData.reduce(
            (acc, item) => [...acc, ...item.visitedObjectIds],
            [] as Id<'objects'>[],
        );

        return [...userMarkers, ...publicMarkers].map(item => ({
            id: item.objectId,
            latitude: item.latitude,
            longitude: item.longitude,
            isRemoved: item.isRemoved,
            isVisited: visitedMarkers.includes(item.objectId),
            isPublic: item.isPublic,
            isOwner: item.createdById === user._id,
        }));
    },
});
