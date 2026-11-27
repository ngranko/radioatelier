import {ConvexError} from 'convex/values';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx, QueryCtx} from '../_generated/server';

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
    const previewUrl = await ctx.storage.getUrl(storageId);
    if (!previewUrl) {
        throw new ConvexError('Failed to get URL for image preview');
    }
    const previousPreviewId = image.previewStorageId;
    await ctx.db.patch('images', id, {previewStorageId: storageId});
    if (previousPreviewId && previousPreviewId !== storageId) {
        await deleteUnusedImageFile(ctx, previousPreviewId);
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

// The cropped preview is how an Object presents its photo; the original stands in until one is cut.
export async function resolveImageThumbnailUrl(ctx: QueryCtx, imageId: Id<'images'>) {
    const image = await ctx.db.get('images', imageId);
    const storageId = image?.previewStorageId ?? image?.originalStorageId;
    return storageId ? await ctx.storage.getUrl(storageId) : null;
}
