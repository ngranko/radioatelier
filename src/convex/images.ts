import {ConvexError, v} from 'convex/values';
import {mutation} from './_generated/server';
import {replaceImagePreview} from './helpers/imageStorage';
import {getCurrentUserOrThrow} from './users';

export const generateUploadUrl = mutation({
    args: {},
    handler: async ctx => {
        await getCurrentUserOrThrow(ctx);
        return await ctx.storage.generateUploadUrl();
    },
});

export const create = mutation({
    args: {
        storageId: v.id('_storage'),
    },
    handler: async (ctx, {storageId}) => {
        const user = await getCurrentUserOrThrow(ctx);
        const imageId = await ctx.db.insert('images', {
            originalStorageId: storageId,
            createdById: user._id,
        });
        const url = await ctx.storage.getUrl(storageId);
        if (!url) {
            throw new ConvexError('Failed to get URL for image');
        }

        return {id: imageId, url, previewUrl: ''};
    },
});

export const updatePreview = mutation({
    args: {
        id: v.id('images'),
        storageId: v.id('_storage'),
    },
    returns: v.object({id: v.id('images'), previewUrl: v.string()}),
    handler: async (ctx, {id, storageId}) => {
        const user = await getCurrentUserOrThrow(ctx);
        return replaceImagePreview(ctx, user._id, id, storageId);
    },
});
