import type {Id} from './_generated/dataModel';
import {internalMutation} from './_generated/server';

export const cleanup = internalMutation({
    args: {},
    handler: async ctx => {
        const referencedImageIds = new Set(
            (await ctx.db.query('objects').collect())
                .map(object => object.coverId)
                .filter((coverId): coverId is Id<'images'> => coverId !== null),
        );

        const images = await ctx.db.query('images').collect();
        const retainedImages = [];
        for (const image of images) {
            if (!referencedImageIds.has(image._id)) {
                await ctx.db.delete('images', image._id);
                continue;
            }

            retainedImages.push(image);
        }

        const referencesFileIds = new Set<Id<'_storage'>>();
        for (const image of retainedImages) {
            referencesFileIds.add(image.originalStorageId);
            if (image.previewStorageId) {
                referencesFileIds.add(image.previewStorageId);
            }
        }

        const files = await ctx.db.system.query('_storage').collect();
        for (const file of files) {
            if (!referencesFileIds.has(file._id)) {
                await ctx.storage.delete(file._id);
            }
        }
    },
});
