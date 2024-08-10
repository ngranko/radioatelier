export interface CreatePrivateTagInputs {
    name: string;
}

export type CreatePrivateTagResponsePayload = PrivateTag;

export interface ListPrivateTagsResponsePayload {
    tags: PrivateTag[];
}

export interface PrivateTag {
    id: string;
    name: string;
}
