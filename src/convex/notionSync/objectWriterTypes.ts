import type {Doc, Id} from '../_generated/dataModel';
import type {NotionPageFields} from '../notion/types';
import type {AppSyncPatch} from './types';

export type CreateSyncedObjectInput = {
    notionPageId: string;
    ownerId: Id<'users'>;
    latitude: number;
    longitude: number;
    fields: NotionPageFields;
    lastInboundEditedTime: string | null;
};

export type PatchSyncedObjectInput = {
    objectId: Id<'objects'>;
    notionPageId: string;
    patch: AppSyncPatch;
    lastInboundEditedTime: string | null;
};

export type PatchTarget = {
    object: Doc<'objects'>;
    mapPoint: Doc<'mapPoints'>;
    category: Doc<'categories'>;
    marker: Doc<'markers'>;
};

export type SyncClassification = {
    categoryName: string;
    categoryId: Id<'categories'>;
    tagNames: string[];
    tagIds: Id<'tags'>[];
};
