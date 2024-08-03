export interface CreateTagInputs {
    name: string;
}

export type CreateTagResponsePayload = Tag;

export interface ListTagsResponsePayload {
    tags: Tag[];
}

interface Tag {
    id: string;
    name: string;
}
