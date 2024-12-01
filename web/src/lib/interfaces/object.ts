import type {Category} from '$lib/interfaces/category';
import type {Tag} from '$lib/interfaces/tag';
import type {PrivateTag} from '$lib/interfaces/privateTag';

interface TaxonomlessObject {
    name: string;
    description: string;
    lat: string;
    lng: string;
    address: string;
    city: string;
    country: string;
    installedPeriod: string;
    isRemoved: boolean;
    removalPeriod: string;
    source: string;
    image: string;
    isPublic: boolean;
    isVisited: boolean;
    rating: string;
}

interface BaseObject extends TaxonomlessObject {
    category: Partial<Category>;
    tags: Partial<Tag>[];
    privateTags: Partial<PrivateTag>[];
}

export interface Object extends BaseObject {
    id: string;
}

export interface LooseObject extends BaseObject {
    id: string | null;
}

export interface FormObject extends TaxonomlessObject {
    id: string | null;
    category: string;
    tags: string[];
    privateTags: string[];
}

export interface BareObject {
    id: string | null;
    lat: string;
    lng: string;
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

export interface MarkerListItem extends ObjectListItem {
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
