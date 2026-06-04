import {paginationOptsValidator} from 'convex/server';
import {v} from 'convex/values';
import type {Doc, Id} from '../_generated/dataModel';
import {internalQuery, type MutationCtx, type QueryCtx} from '../_generated/server';
import {getNotionSyncAppUrl} from '../notion/config';
import {loadSnapshotCache, type SnapshotCache} from './snapshotCache';
import type {AppSyncFields} from './types';

export type ObjectSyncSnapshot = {
    objectId: Id<'objects'>;
    owner: {
        _id: Id<'users'>;
        notionSyncEnabled: boolean;
    };
    sync: Doc<'objectNotionSync'> | null;
    fields: AppSyncFields;
};

export type ObjectSyncSnapshotPage = {
    page: ObjectSyncSnapshot[];
    isDone: boolean;
    continueCursor: string;
};

export const getObjectSnapshot = internalQuery({
    args: {
        objectId: v.id('objects'),
    },
    handler: async (ctx, {objectId}): Promise<ObjectSyncSnapshot | null> => {
        const object = await ctx.db.get('objects', objectId);
        if (!object) {
            return null;
        }
        return await loadObjectSnapshot(ctx, object);
    },
});

export const listEligibleOwnerPage = internalQuery({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, {paginationOpts}) => {
        const result = await ctx.db
            .query('users')
            .withIndex('byNotionSyncEnabled', q => q.eq('notionSyncEnabled', true))
            .paginate(paginationOpts);
        return {
            ...result,
            page: result.page.filter(owner => !owner.isDeleted),
        };
    },
});

export const listEligibleObjectSnapshotPage = internalQuery({
    args: {
        ownerId: v.id('users'),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, {ownerId, paginationOpts}): Promise<ObjectSyncSnapshotPage> => {
        const owner = await ctx.db.get('users', ownerId);
        if (!owner || owner.isDeleted || !owner.notionSyncEnabled) {
            return {
                page: [],
                isDone: true,
                continueCursor: paginationOpts.cursor ?? '',
            };
        }

        const result = await ctx.db
            .query('objects')
            .withIndex('byCreatedById', q => q.eq('createdById', owner._id))
            .paginate(paginationOpts);
        const cache = await loadSnapshotCache(ctx, result.page, new Map([[owner._id, owner]]));
        return {
            ...result,
            page: result.page
                .map(object => assembleObjectSnapshot(object, cache))
                .filter((snapshot): snapshot is ObjectSyncSnapshot => snapshot !== null),
        };
    },
});

export function assembleObjectSnapshot(
    object: Doc<'objects'>,
    cache: SnapshotCache,
): ObjectSyncSnapshot | null {
    const mapPoint = cache.mapPoints.get(object.mapPointId);
    const category = cache.categories.get(object.categoryId);
    const owner = cache.owners.get(object.createdById);
    if (!mapPoint || !category || !owner) {
        return null;
    }
    const tagNames = object.tagIds
        .map(tagId => cache.tags.get(tagId)?.name ?? null)
        .filter((item): item is string => Boolean(item));
    return {
        objectId: object._id,
        owner: {
            _id: owner._id,
            notionSyncEnabled: owner.notionSyncEnabled ?? false,
        },
        sync: cache.syncByObjectId.get(object._id) ?? null,
        fields: buildAppFields({
            objectId: object._id,
            name: object.name,
            categoryName: category.name,
            address: mapPoint.address,
            city: mapPoint.city,
            country: mapPoint.country,
            installedPeriod: object.installedPeriod,
            isRemoved: object.isRemoved,
            removalPeriod: object.removalPeriod,
            tagNames,
            isVisited: cache.visitedByObjectId.get(object._id) ?? false,
            source: object.source,
        }),
    };
}

async function loadObjectSnapshot(
    ctx: QueryCtx,
    object: Doc<'objects'>,
): Promise<ObjectSyncSnapshot | null> {
    const owner = await ctx.db.get('users', object.createdById);
    if (!owner) {
        return null;
    }
    const cache = await loadSnapshotCache(ctx, [object], new Map([[owner._id, owner]]));
    return assembleObjectSnapshot(object, cache);
}

export function buildAppFields(input: {
    objectId: string;
    name: string;
    categoryName: string;
    address: string | null;
    city: string | null;
    country: string | null;
    installedPeriod: string | null;
    isRemoved: boolean;
    removalPeriod: string | null;
    tagNames: string[];
    isVisited: boolean;
    source: string | null;
}): AppSyncFields {
    return {
        name: input.name,
        categoryName: input.categoryName,
        address: input.address,
        city: input.city,
        country: input.country,
        mapLink: buildObjectUrl(getNotionSyncAppUrl(), input.objectId),
        installedPeriod: input.installedPeriod,
        isRemoved: input.isRemoved,
        removalPeriod: input.removalPeriod,
        tagNames: input.tagNames,
        isVisited: input.isVisited,
        source: input.source,
    };
}

export async function readTagNames(
    ctx: Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>,
    tagIds: Id<'tags'>[],
): Promise<string[]> {
    const tags = await Promise.all(tagIds.map(tagId => ctx.db.get('tags', tagId)));
    return tags.map(tag => tag?.name ?? null).filter((item): item is string => Boolean(item));
}

export function normalizeCategoryName(value: string | null | undefined) {
    const normalized = value?.trim().toLowerCase();
    return normalized || null;
}

export function normalizeNames(values: string[]) {
    return [...new Set(values.map(item => item.trim().toLowerCase()).filter(Boolean))];
}

function buildObjectUrl(baseUrl: string, objectId: string) {
    return new URL(`/object/${objectId}`, ensureTrailingSlash(baseUrl)).toString();
}

function ensureTrailingSlash(value: string) {
    return value.endsWith('/') ? value : `${value}/`;
}
