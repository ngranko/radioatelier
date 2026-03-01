import {v} from 'convex/values';
import {mutation} from './_generated/server';
import {getCurrentUserOrThrow} from './users';

export const generateUploadUrl = mutation({
    args: {},
    handler: async ctx => {
        getCurrentUserOrThrow(ctx);
        return await ctx.storage.generateUploadUrl();
    },
});

export const create = mutation({
    args: {
        storageId: v.id('_storage'),
    },
    handler: async (ctx, {storageId}) => {
        getCurrentUserOrThrow(ctx);
        const imageId = await ctx.db.insert('images', {
            originalStorageId: storageId,
        });
        const url = await ctx.storage.getUrl(storageId);
        return {id: imageId, url};
    },
});
