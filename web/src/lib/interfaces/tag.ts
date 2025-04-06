export interface CreateTagInputs {
    name: string;
}

export type CreateTagResponsePayload = Tag;

export interface ListTagsResponsePayload {
    tags: Tag[];
}

export interface Tag {
    id: string;
    name: string;
}

export interface FuzzyTag {
    id: string;
    name?: string;
}
