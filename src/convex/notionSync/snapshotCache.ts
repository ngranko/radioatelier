import type {Doc, Id} from '../_generated/dataModel';
import type {QueryCtx} from '../_generated/server';
import {getVisitedChunkId} from '../utils/visitedChunks';

export type SnapshotCache = {
    owners: Map<Id<'users'>, Doc<'users'>>;
    mapPoints: Map<Id<'mapPoints'>, Doc<'mapPoints'>>;
    categories: Map<Id<'categories'>, Doc<'categories'>>;
    tags: Map<Id<'tags'>, Doc<'tags'>>;
    syncByObjectId: Map<Id<'objects'>, Doc<'objectNotionSync'> | null>;
    visitedByObjectId: Map<Id<'objects'>, boolean>;
};

type VisitedPairGroup = {
    userId: Id<'users'>;
    chunkId: string;
    objectIds: Id<'objects'>[];
};

export async function loadSnapshotCache(
    ctx: QueryCtx,
    objects: Doc<'objects'>[],
    owners: Map<Id<'users'>, Doc<'users'>>,
): Promise<SnapshotCache> {
    if (objects.length === 0) {
        return emptySnapshotCache(owners);
    }

    const [mapPoints, categories, tags, syncByObjectId, visitedByObjectId] = await Promise.all([
        loadMapPoints(ctx, objects),
        loadCategories(ctx, objects),
        loadTags(ctx, objects),
        loadSyncRecords(ctx, objects),
        loadVisitedFlags(ctx, objects),
    ]);

    return {
        owners,
        mapPoints,
        categories,
        tags,
        syncByObjectId,
        visitedByObjectId,
    };
}

function emptySnapshotCache(owners: Map<Id<'users'>, Doc<'users'>>): SnapshotCache {
    return {
        owners,
        mapPoints: new Map(),
        categories: new Map(),
        tags: new Map(),
        syncByObjectId: new Map(),
        visitedByObjectId: new Map(),
    };
}

async function loadMapPoints(ctx: QueryCtx, objects: Doc<'objects'>[]) {
    const mapPoints = new Map<Id<'mapPoints'>, Doc<'mapPoints'>>();
    const mapPointIds = [...new Set(objects.map(object => object.mapPointId))];
    await Promise.all(
        mapPointIds.map(async mapPointId => {
            const mapPoint = await ctx.db.get('mapPoints', mapPointId);
            if (mapPoint) {
                mapPoints.set(mapPointId, mapPoint);
            }
        }),
    );
    return mapPoints;
}

async function loadCategories(ctx: QueryCtx, objects: Doc<'objects'>[]) {
    const categories = new Map<Id<'categories'>, Doc<'categories'>>();
    const categoryIds = [...new Set(objects.map(object => object.categoryId))];
    await Promise.all(
        categoryIds.map(async categoryId => {
            const category = await ctx.db.get('categories', categoryId);
            if (category) {
                categories.set(categoryId, category);
            }
        }),
    );
    return categories;
}

async function loadTags(ctx: QueryCtx, objects: Doc<'objects'>[]) {
    const tags = new Map<Id<'tags'>, Doc<'tags'>>();
    const tagIds = [...new Set(objects.flatMap(object => object.tagIds))];
    await Promise.all(
        tagIds.map(async tagId => {
            const tag = await ctx.db.get('tags', tagId);
            if (tag) {
                tags.set(tagId, tag);
            }
        }),
    );
    return tags;
}

async function loadSyncRecords(ctx: QueryCtx, objects: Doc<'objects'>[]) {
    const syncByObjectId = new Map<Id<'objects'>, Doc<'objectNotionSync'> | null>();
    await Promise.all(
        objects.map(async object => {
            const sync = await ctx.db
                .query('objectNotionSync')
                .withIndex('byObjectId', q => q.eq('objectId', object._id))
                .unique();
            syncByObjectId.set(object._id, sync);
        }),
    );
    return syncByObjectId;
}

async function loadVisitedFlags(ctx: QueryCtx, objects: Doc<'objects'>[]) {
    const visitedByObjectId = new Map<Id<'objects'>, boolean>();
    const pairGroups = groupObjectsByVisitedPair(objects);
    await Promise.all(
        [...pairGroups.values()].map(async group => {
            const visitedData = await ctx.db
                .query('userVisitedChunks')
                .withIndex('byUserIdAndChunkId', q =>
                    q.eq('userId', group.userId).eq('chunkId', group.chunkId),
                )
                .unique();
            const visitedObjectIds = new Set(visitedData?.visitedObjectIds ?? []);
            for (const objectId of group.objectIds) {
                visitedByObjectId.set(objectId, visitedObjectIds.has(objectId));
            }
        }),
    );
    return visitedByObjectId;
}

function groupObjectsByVisitedPair(objects: Doc<'objects'>[]) {
    const pairGroups = new Map<string, VisitedPairGroup>();
    for (const object of objects) {
        const chunkId = getVisitedChunkId(object._id);
        const pairKey = `${object.createdById}:${chunkId}`;
        const group = pairGroups.get(pairKey) ?? {
            userId: object.createdById,
            chunkId,
            objectIds: [],
        };
        group.objectIds.push(object._id);
        pairGroups.set(pairKey, group);
    }
    return pairGroups;
}
