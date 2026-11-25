import {MAX_OBJECT_IMAGES} from '../../lib/utils/fieldLimits';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx, QueryCtx} from '../_generated/server';

export async function listObjectImages(ctx: QueryCtx, objectId: Id<'objects'>) {
    const links = await listGalleryLinks(ctx, objectId);
    const images = await Promise.all(links.map(link => ctx.db.get('images', link.imageId)));
    return images.filter(image => image !== null);
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

    const accepted = await selectAttachable(ctx, objectId, userId, imageIds);
    await detachObjectImages(ctx, objectId);
    for (const [position, imageId] of accepted.entries()) {
        await ctx.db.insert('objectImages', {objectId, imageId, position});
    }
    await ctx.db.patch('objects', objectId, {coverId: accepted[0] ?? null});
}

export async function detachObjectImages(ctx: MutationCtx, objectId: Id<'objects'>) {
    for (const link of await listGalleryLinks(ctx, objectId)) {
        await ctx.db.delete('objectImages', link._id);
    }
}

export async function isImageInGallery(ctx: QueryCtx, imageId: Id<'images'>) {
    const link = await ctx.db
        .query('objectImages')
        .withIndex('byImageId', q => q.eq('imageId', imageId))
        .first();
    return link !== null;
}

async function selectAttachable(
    ctx: QueryCtx,
    objectId: Id<'objects'>,
    userId: Id<'users'>,
    imageIds: Id<'images'>[],
) {
    const links = await listGalleryLinks(ctx, objectId);
    const held = new Set(links.map(link => link.imageId));
    const accepted: Id<'images'>[] = [];
    for (const imageId of new Set(imageIds)) {
        if (held.has(imageId) || (await isClaimable(ctx, imageId, userId))) {
            accepted.push(imageId);
        }
    }
    return accepted;
}

function listGalleryLinks(ctx: QueryCtx, objectId: Id<'objects'>) {
    return ctx.db
        .query('objectImages')
        .withIndex('byObjectIdAndPosition', q => q.eq('objectId', objectId))
        .collect();
}

// Image ids are handed to every viewer of an Object, so only the uploader may
// claim one, and only while no gallery holds it.
async function isClaimable(ctx: QueryCtx, imageId: Id<'images'>, userId: Id<'users'>) {
    const image = await ctx.db.get('images', imageId);
    return image?.createdById === userId && !(await isImageInGallery(ctx, imageId));
}
