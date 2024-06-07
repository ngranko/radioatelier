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
