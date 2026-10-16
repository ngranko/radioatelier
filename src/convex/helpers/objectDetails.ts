import type {Doc, Id} from '../_generated/dataModel';
import type {QueryCtx} from '../_generated/server';
import {getIsVisited, getPrivateTags} from './objectHelpers';
import {listObjectImages} from './objectImages';
import type {ObjectAggregate} from './objectReader';

type ObjectCover = {
    id: Id<'images'>;
    url: string;
    previewUrl: string;
};

type ObjectViewerContext = {
    userId: Id<'users'> | null;
    privateTags: Doc<'privateTags'>[];
    isVisited: boolean;
    cover: ObjectCover | null;
    images: ObjectCover[];
};

export async function loadObjectDetails(
    ctx: QueryCtx,
    aggregate: ObjectAggregate,
    user: Doc<'users'> | null,
) {
    return buildObjectDetails(aggregate, await loadViewerContext(ctx, aggregate.object, user));
}

export function buildObjectDetails(aggregate: ObjectAggregate, viewer: ObjectViewerContext) {
    const {object, mapPoint, category, tags} = aggregate;
    return {
        id: object._id,
        latitude: mapPoint.latitude,
        longitude: mapPoint.longitude,
        name: object.name,
        description: object.description,
        address: mapPoint.address,
        city: mapPoint.city,
        country: mapPoint.country,
        installedPeriod: object.installedPeriod,
        isRemoved: object.isRemoved,
        removalPeriod: object.removalPeriod,
        source: object.source,
        cover: viewer.cover,
        images: viewer.images,
        isPublic: object.isPublic,
        category: {
            id: category._id,
            name: category.name,
        },
        tags: tags.map(tag => ({
            id: tag._id,
            name: tag.name,
        })),
        privateTags: viewer.privateTags.map(tag => ({
            id: tag._id,
            name: tag.name,
        })),
        isVisited: viewer.isVisited,
        isOwner: object.createdById === viewer.userId,
        internalId: viewer.userId ? object.internalId : null,
    };
}

async function loadViewerContext(
    ctx: QueryCtx,
    object: Doc<'objects'>,
    user: Doc<'users'> | null,
): Promise<ObjectViewerContext> {
    const [privateTags, isVisited] = user
        ? await Promise.all([
              getPrivateTags(ctx, object._id, user._id),
              getIsVisited(ctx, object._id, user._id),
          ])
        : [[], false];
    return {
        userId: user?._id ?? null,
        privateTags,
        isVisited,
        ...(await loadImages(ctx, object)),
    };
}

async function loadImages(ctx: QueryCtx, object: Doc<'objects'>) {
    const attached = await listObjectImages(ctx, object._id);
    // A cover from before galleries existed is referenced by coverId alone.
    const cover = object.coverId
        ? (attached.find(image => image._id === object.coverId) ??
          (await ctx.db.get('images', object.coverId)))
        : null;
    const ordered = cover
        ? [cover, ...attached.filter(image => image._id !== cover._id)]
        : attached;
    const images = await Promise.all(ordered.map(image => resolveImageUrls(ctx, image)));

    return {cover: cover ? images[0] : null, images};
}

async function resolveImageUrls(ctx: QueryCtx, image: Doc<'images'>): Promise<ObjectCover> {
    const [url, previewUrl] = await Promise.all([
        image.originalStorageId ? ctx.storage.getUrl(image.originalStorageId) : null,
        image.previewStorageId ? ctx.storage.getUrl(image.previewStorageId) : null,
    ]);
    return {
        id: image._id,
        url: url ?? '',
        previewUrl: previewUrl ?? '',
    };
}
