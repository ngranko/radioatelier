import {ConvexError} from 'convex/values';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';

export async function replaceImagePreview(
    ctx: MutationCtx,
    userId: Id<'users'>,
    id: Id<'images'>,
    storageId: Id<'_storage'>,
) {
    const image = await ctx.db.get('images', id);
    // Image IDs are visible to other viewers; knowing one does not grant preview ownership.
    if (!image || image.createdById !== userId) {
        throw new ConvexError('Image not found');
    }
    await ctx.db.patch('images', id, {previewStorageId: storageId});
    if (image.previewStorageId && image.previewStorageId !== storageId) {
        await deleteUnusedImageFile(ctx, image.previewStorageId);
    }
    const previewUrl = await ctx.storage.getUrl(storageId);
    if (!previewUrl) {
        throw new ConvexError('Failed to get URL for image preview');
    }
    return {id, previewUrl};
}

export async function deleteUnusedImageFile(ctx: MutationCtx, fileId: Id<'_storage'>) {
    const original = await ctx.db
        .query('images')
        .withIndex('byOriginalStorageId', q => q.eq('originalStorageId', fileId))
        .first();
    const preview = await ctx.db
        .query('images')
        .withIndex('byPreviewStorageId', q => q.eq('previewStorageId', fileId))
        .first();
    if (!original && !preview) {
        await ctx.storage.delete(fileId);
    }
}
