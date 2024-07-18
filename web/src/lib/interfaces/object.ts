export interface Object {
    id: string;
    name: string;
    categoryId: string;
    lat: string;
    lng: string;
}

export interface LooseObject {
    id: string | null;
    name: string;
    description: string;
    categoryId: string;
    lat: string;
    lng: string;
    address: string;
}

export interface BareObject {
    id: string | null;
    lat: string;
    lng: string;
}

export interface ObjectDetailsInfo {
    isLoading: boolean;
    object: Object | BareObject | null;
}

export interface CreateObjectInputs {
    name: string;
    lat: string;
    lng: string;
    categoryId: string;
}

export type CreateObjectResponsePayload = Object;

export interface ListObjectsResponsePayload {
    objects: ObjectListItem[];
}

interface ObjectListItem {
    id: string;
    lat: string;
    lng: string;
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

export interface DeleteObjectInputs {
    id: string;
}

export interface DeleteObjectPayloadData {
    id: string;
}
