export interface Object {
    id: string;
    name: string;
    categoryId: string;
    lat: string;
    lng: string;
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

export interface CreateObjectResponsePayload {
    id: string;
    name: string;
    lat: string;
    lng: string;
}

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
