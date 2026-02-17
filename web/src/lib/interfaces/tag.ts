import type {Id} from '$convex/_generated/dataModel';

export interface CreateTagInputs {
    name: string;
}

export type CreateTagResponsePayload = Tag;

export interface ListTagsResponsePayload {
    tags: Tag[];
}

export interface Tag {
    id: Id<'tags'>;
    name: string;
}

export interface FuzzyTag {
    id: Id<'tags'>;
    name: string;
}
