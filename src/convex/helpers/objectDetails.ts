import type {Doc, Id} from '../_generated/dataModel';
import type {ObjectAggregate} from './objectReader';

export type ObjectCover = {
    id: Id<'images'>;
    url: string;
    previewUrl: string;
};

export type ObjectViewerContext = {
    userId: Id<'users'> | null;
    privateTags: Doc<'privateTags'>[];
    isVisited: boolean;
    cover: ObjectCover | null;
};

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
