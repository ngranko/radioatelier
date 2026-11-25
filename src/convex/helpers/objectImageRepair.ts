import {MAX_OBJECT_IMAGES} from '../../lib/utils/fieldLimits';
import type {Doc, Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';

export async function repairObjectGallery(ctx: MutationCtx, object: Doc<'objects'>) {
    if (!object.coverId) {
        return;
    }
    const cover = await ctx.db.get('images', object.coverId);
    if (!cover) {
        throw new Error(`Missing cover for Object ${object._id}`);
    }
    if (await isIndependentCover(ctx, object, cover)) {
        return;
    }

    const gallery = await ctx.db
        .query('objectImages')
        .withIndex('byObjectIdAndPosition', q => q.eq('objectId', object._id))
        .collect();
    const coverLink = gallery.find(link => link.imageId === cover._id);
    if (!coverLink && gallery.length >= MAX_OBJECT_IMAGES) {
        throw new Error(`Gallery is full for Object ${object._id}`);
    }

    const coverId = await copyCover(ctx, object, cover);
    if (coverLink) {
        await ctx.db.patch('objectImages', coverLink._id, {imageId: coverId});
    } else {
        await prependToGallery(ctx, object._id, gallery, coverId);
    }
    await ctx.db.patch('objects', object._id, {coverId});
}

// A cover saved before galleries existed may still be shared with other
// Objects, through their galleries or their coverId, or belong to nobody.
async function isIndependentCover(ctx: MutationCtx, object: Doc<'objects'>, cover: Doc<'images'>) {
    if (cover.createdById !== object.createdById) {
        return false;
    }
    const holders = await ctx.db
        .query('objectImages')
        .withIndex('byImageId', q => q.eq('imageId', cover._id))
        .collect();
    return holders.length > 0 && holders.every(link => link.objectId === object._id);
}

// Files are immutable; only the image record and its preview choice need separate ownership.
function copyCover(ctx: MutationCtx, object: Doc<'objects'>, cover: Doc<'images'>) {
    return ctx.db.insert('images', {
        originalStorageId: cover.originalStorageId,
        ...(cover.previewStorageId ? {previewStorageId: cover.previewStorageId} : {}),
        createdById: object.createdById,
    });
}

async function prependToGallery(
    ctx: MutationCtx,
    objectId: Id<'objects'>,
    gallery: Doc<'objectImages'>[],
    imageId: Id<'images'>,
) {
    for (const [index, link] of gallery.entries()) {
        await ctx.db.patch('objectImages', link._id, {position: index + 1});
    }
    await ctx.db.insert('objectImages', {objectId, imageId, position: 0});
}
