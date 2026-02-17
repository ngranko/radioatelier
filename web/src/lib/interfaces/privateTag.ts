import type {Id} from '$convex/_generated/dataModel';

export interface CreatePrivateTagInputs {
    name: string;
}

export type CreatePrivateTagResponsePayload = PrivateTag;

export interface ListPrivateTagsResponsePayload {
    tags: PrivateTag[];
}

export interface PrivateTag {
    id: Id<'privateTags'>;
    name: string;
}

export interface FuzzyPrivateTag {
    id: Id<'privateTags'>;
    name: string;
}
