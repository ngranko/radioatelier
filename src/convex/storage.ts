import {v} from 'convex/values';
import {internal} from './_generated/api';
import type {Id} from './_generated/dataModel';
import {internalMutation, type MutationCtx} from './_generated/server';

const SWEEP_BATCH_SIZE = 100;
// Uploads are stored before the object that references them is saved, so a
// young file or image is unreferenced because the form is still open, not
// because it was abandoned.
const GRACE_PERIOD_MS = 1000 * 60 * 60 * 24;

export const sweepUnusedImages = internalMutation({
    args: {cursor: v.nullable(v.string())},
    handler: async (ctx, {cursor}) => {
        const page = await ctx.db.query('images').paginate({numItems: SWEEP_BATCH_SIZE, cursor});
        const cutoff = Date.now() - GRACE_PERIOD_MS;

        for (const image of page.page) {
            if (image._creationTime < cutoff && !(await isImageReferenced(ctx, image._id))) {
                await ctx.db.delete('images', image._id);
            }
        }

        if (!page.isDone) {
            await ctx.scheduler.runAfter(0, internal.storage.sweepUnusedImages, {
                cursor: page.continueCursor,
            });
            return;
        }

        // Files go second so the ones behind images deleted above are
        // collected in the same run.
        await ctx.scheduler.runAfter(0, internal.storage.sweepUnusedFiles, {cursor: null});
    },
});

export const sweepUnusedFiles = internalMutation({
    args: {cursor: v.nullable(v.string())},
    handler: async (ctx, {cursor}) => {
        const page = await ctx.db.system
            .query('_storage')
            .paginate({numItems: SWEEP_BATCH_SIZE, cursor});
        const cutoff = Date.now() - GRACE_PERIOD_MS;

        for (const file of page.page) {
            if (file._creationTime < cutoff && !(await isFileReferenced(ctx, file._id))) {
                await ctx.storage.delete(file._id);
            }
        }

        if (!page.isDone) {
            await ctx.scheduler.runAfter(0, internal.storage.sweepUnusedFiles, {
                cursor: page.continueCursor,
            });
        }
    },
});

async function isImageReferenced(ctx: MutationCtx, imageId: Id<'images'>) {
    const cover = await ctx.db
        .query('objects')
        .withIndex('byCoverId', q => q.eq('coverId', imageId))
        .first();
    return cover !== null;
}

async function isFileReferenced(ctx: MutationCtx, fileId: Id<'_storage'>) {
    const asOriginal = await ctx.db
        .query('images')
        .withIndex('byOriginalStorageId', q => q.eq('originalStorageId', fileId))
        .first();
    if (asOriginal) {
        return true;
    }

    const asPreview = await ctx.db
        .query('images')
        .withIndex('byPreviewStorageId', q => q.eq('previewStorageId', fileId))
        .first();
    return asPreview !== null;
}
