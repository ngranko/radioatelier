import type {Id} from '$convex/_generated/dataModel';
import type {FuzzyCategory} from '$lib/interfaces/category';
import type {FuzzyPrivateTag} from '$lib/interfaces/privateTag';
import type {FuzzyTag} from '$lib/interfaces/tag';

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
}

interface BaseObject extends TaxonomlessObject {
    category: FuzzyCategory;
    tags: FuzzyTag[];
    privateTags: FuzzyPrivateTag[];
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

export interface BareObject {
    id: Id<'objects'> | null;
    name?: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
    isRemoved: boolean;
    isVisited: boolean;
}

export interface ObjectFormInputs extends Omit<TaxonomlessObject, 'isOwner'> {
    id?: Id<'objects'>;
    category: string;
    tags: string[];
    privateTags: string[];
    cover?: string;
}

export type CreateObjectInputs = Omit<ObjectFormInputs, 'id'>;

export type CreateObjectResponsePayload = Object;

export interface ListObjectsResponsePayload {
    objects: ObjectListItem[];
}

export interface ObjectListItem {
    id: string;
    latitude: number;
    longitude: number;
    isRemoved: boolean;
    isVisited: boolean;
    isOwner: boolean;
}

export interface GetObjectResponsePayload {
    object: Object;
}

export interface UpdateObjectInputs {
    id: string;
    updatedFields: Partial<Omit<ObjectFormInputs, 'id' | 'latitude' | 'longitude'>>;
}

export type UpdateObjectResponsePayload = Object;

export interface RepositionObjectInputs {
    id: string;
    updatedFields: Pick<Object, 'latitude' | 'longitude'>;
}

export type RepositionObjectResponsePayload = BareObject;

export interface DeleteObjectInputs {
    id: string;
}

export interface DeleteObjectPayloadData {
    id: string;
}

export interface SearchPointListItem {
    object: SearchItem;
}

export interface SearchItem {
    id: string;
    name: string;
    categoryName: string;
    latitude: number;
    longitude: number;
    address: string;
    city: string;
    country: string;
    type: 'local' | 'google';
}

export interface SearchLocalResponsePayload {
    items: SearchItem[];
    hasMore: boolean;
    offset: number;
}

export interface SearchGoogleResponsePayload {
    items: SearchItem[];
    hasMore: boolean;
    nextPageToken: string;
}

export type SearchContext = [string, SearchInputs];

export interface SearchInputs {
    query: string;
    latitude: string;
    longitude: string;
}

export interface MapPlaceable {
    latitude: number;
    longitude: number;
}
