import type {FuzzyCategory} from '$lib/interfaces/category';
import type {FuzzyTag} from '$lib/interfaces/tag';
import type {FuzzyPrivateTag} from '$lib/interfaces/privateTag';

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
    image?: string;
    isPublic: boolean;
    isVisited: boolean;
    rating?: string;
}

interface BaseObject extends TaxonomlessObject {
    category: FuzzyCategory;
    tags: FuzzyTag[];
    privateTags: FuzzyPrivateTag[];
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

export interface ObjectDetailsInfo {
    isMinimized: boolean;
    isLoading: boolean;
    isEditing: boolean;
    isDirty: boolean;
    detailsId: string;
    object: Object | BareObject | null;
}

export type CreateObjectInputs = Omit<Object, 'id'>;

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
}

export interface PointListItem {
    object: ObjectListItem;
    marker?: google.maps.marker.AdvancedMarkerElement;
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
    updatedFields: Omit<Object, 'id' | 'lat' | 'lng'>;
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

export interface UploadImageInputs {
    id: string;
    formData: FormData;
}

export interface UploadImagePayloadData {
    url: string;
}

export interface SearchPointListItem {
    object: SearchItem;
    marker?: google.maps.marker.AdvancedMarkerElement;
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
