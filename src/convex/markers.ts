import {v} from 'convex/values';
import {query} from './_generated/server';
import {getCurrentUserOrThrow} from './users';

export const list = query({
    args: {authUserId: v.string()},
    handler: async (ctx, {authUserId}) => {
        const user = await getCurrentUserOrThrow(ctx);
        if (user.externalId !== authUserId) {
            throw new Error('Marker query user does not match the authenticated user');
        }

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

        return [...userMarkers, ...publicMarkers].map(item => ({
            id: item.objectId,
            latitude: item.latitude,
            longitude: item.longitude,
            isRemoved: item.isRemoved,
            categoryId: item.categoryId,
            isPublic: item.isPublic,
            isOwner: item.createdById === user._id,
        }));
    },
});

export const listVisitedIds = query({
    args: {authUserId: v.string()},
    handler: async (ctx, {authUserId}) => {
        const user = await getCurrentUserOrThrow(ctx);
        if (user.externalId !== authUserId) {
            throw new Error('Marker query user does not match the authenticated user');
        }

        const visitedData = await ctx.db
            .query('userVisitedChunks')
            .withIndex('byUserIdAndChunkId', q => q.eq('userId', user._id))
            .collect();

        return visitedData.flatMap(item => item.visitedObjectIds);
    },
});
