import type {Id} from '$convex/_generated/dataModel';
import type {Category} from '$lib/interfaces/category';
import type {PrivateTag} from '$lib/interfaces/privateTag';
import type {Tag} from '$lib/interfaces/tag';

interface TaxonomlessObject {
    name: string;
    description: string | null;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
    installedPeriod: string | null;
    isRemoved: boolean;
    removalPeriod: string | null;
    source: string | null;
    isPublic: boolean;
    isVisited: boolean;
    isOwner: boolean;
    readonly internalId: string | null;
}

interface BaseObject extends TaxonomlessObject {
    category: Category;
    tags: Tag[];
    privateTags: PrivateTag[];
    cover: {
        id: Id<'images'>;
        url: string;
        previewUrl: string;
    } | null;
}

export interface Object extends BaseObject {
    id: Id<'objects'>;
}

export interface LooseObject extends BaseObject {
    id: Id<'objects'> | null;
}

export interface SearchPointListItem {
    object: SearchItem;
}

export interface SearchItem {
    id: Id<'objects'> | null;
    name: string;
    categoryName: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
    type: 'local' | 'google';
    googlePlaceId: string | null;
}

export interface SearchPreviewResponsePayload {
    items: SearchItem[];
    hasMore: boolean;
}

export interface PointPreviewDetails {
    latitude: number;
    longitude: number;
    name: string;
    categoryName: string;
    address: string;
    city: string;
    country: string;
    type: 'map' | 'google';
    googlePlaceId: string | null;
}

export interface MapPlaceable {
    latitude: number;
    longitude: number;
}
