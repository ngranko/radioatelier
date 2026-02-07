import { query } from "./_generated/server";
import { getCurrentUserOrThrow } from "./users";

export const getListForCurrentUser = query({
    args: {},
    handler: async (ctx) => {
        const user = await getCurrentUserOrThrow(ctx);

        const userMarkers = await ctx.db.query('markers')
        .withIndex('byCreatedByIdAndIsPublic', q => q.eq('createdById', user._id).eq('isPublic', false))
        .collect();

        const publicMarkers = await ctx.db.query('markers')
            .withIndex('byIsPublic', q => q.eq('isPublic', true))
            .collect();

        return [...userMarkers, ...publicMarkers].map(item => ({
            id: item.objectId,
            lat: item.latitude,
            lng: item.longitude,
            isRemoved: item.isRemoved,
            isPublic: item.isPublic,
            isOwner: item.createdById === user._id,
        }));
    },
});