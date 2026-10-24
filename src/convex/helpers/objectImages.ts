import {MAX_OBJECT_IMAGES} from '../../lib/utils/fieldLimits';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx, QueryCtx} from '../_generated/server';

export async function listObjectImages(ctx: QueryCtx, objectId: Id<'objects'>) {
    const images = await ctx.db
        .query('images')
        .withIndex('byObjectId', q => q.eq('objectId', objectId))
        .collect();
    return images.sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
}

export async function replaceObjectImages(
    ctx: MutationCtx,
    objectId: Id<'objects'>,
    userId: Id<'users'>,
    imageIds: Id<'images'>[],
) {
    if (imageIds.length > MAX_OBJECT_IMAGES) {
        throw new Error(`An object holds at most ${MAX_OBJECT_IMAGES} images`);
    }

    const kept = new Set(imageIds);
    for (const image of await listObjectImages(ctx, objectId)) {
        if (!kept.has(image._id)) {
            await ctx.db.patch('images', image._id, {objectId: undefined});
        }
    }

    for (const [position, imageId] of imageIds.entries()) {
        const image = await ctx.db.get('images', imageId);
        // Image ids are handed to every viewer of an Object, so only the
        // uploader may claim one, and only while no gallery holds it.
        const isClaimable = image && !image.objectId && image.createdById === userId;
        if (image?.objectId === objectId || isClaimable) {
            await ctx.db.patch('images', imageId, {objectId, position});
        }
    }
}
