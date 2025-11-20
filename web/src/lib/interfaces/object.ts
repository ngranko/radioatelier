import type {FuzzyCategory} from '$lib/interfaces/category';
import type {FuzzyPrivateTag} from '$lib/interfaces/privateTag';
import type {FuzzyTag} from '$lib/interfaces/tag';

interface TaxonomlessObject {
    name: string;
    description?: string;
    lat: string;
    lng: string;
    address?: string;
    city?: string;
    country?: string;
    installedPeriod?: string;
    isRemoved: boolean;
    removalPeriod?: string;
    source?: string;
    isPublic: boolean;
    isVisited: boolean;
    isOwner: boolean;
}

interface BaseObject extends TaxonomlessObject {
    category: FuzzyCategory;
    tags: FuzzyTag[];
    privateTags: FuzzyPrivateTag[];
    cover: {
        id: string;
        url: string;
        previewUrl: string;
    };
}

export interface Object extends BaseObject {
    id: string;
}

export interface LooseObject extends BaseObject {
    id: string | null;
}

export interface BareObject {
    id: string | null;
    name?: string;
    lat: string;
    lng: string;
    address?: string;
    city?: string;
    country?: string;
    isRemoved: boolean;
    isVisited: boolean;
}

export interface ObjectFormInputs extends Omit<TaxonomlessObject, 'isOwner'> {
    id?: string;
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
    lat: string;
    lng: string;
    isRemoved: boolean;
    isVisited: boolean;
    isOwner: boolean;
}

export interface PointListItem {
    object: ObjectListItem;
}

export type GetObjectContext = [string, GetObjectInputs];

export interface GetObjectInputs {
    id: string;
}

export interface GetObjectResponsePayload {
    object: Object;
}

export interface UpdateObjectInputs {
    id: string;
    updatedFields: Partial<Omit<ObjectFormInputs, 'id' | 'lat' | 'lng'>>;
}

export type UpdateObjectResponsePayload = Object;

export interface RepositionObjectInputs {
    id: string;
    updatedFields: Pick<Object, 'lat' | 'lng'>;
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
    lat: string;
    lng: string;
    address?: string;
    city?: string;
    country?: string;
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
    lat: string;
    lng: string;
}
