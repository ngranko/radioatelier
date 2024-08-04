export interface CreatePrivateTagInputs {
    name: string;
}

export type CreatePrivateTagResponsePayload = PrivateTag;

export interface ListPrivateTagsResponsePayload {
    tags: PrivateTag[];
}

interface PrivateTag {
    id: string;
    name: string;
}
