import type {Id} from './_generated/dataModel';
import {internalMutation} from './_generated/server';

export const cleanup = internalMutation({
    args: {},
    handler: async ctx => {
        const referencesFileIds = new Set<Id<'_storage'>>();

        const images = await ctx.db.query('images').collect();
        for (const image of images) {
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
