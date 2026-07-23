import type {Doc, Id} from '../_generated/dataModel';
import type {QueryCtx} from '../_generated/server';
import {getVisitedChunkId} from '../utils/visitedChunks';

// The sync-specific companions of an Object aggregate: the Sync state record
// and the owner's visited flag. Generic relations (map point, category, tags)
// come from the Object reader.
export type SyncSnapshotExtras = {
    syncByObjectId: Map<Id<'objects'>, Doc<'objectNotionSync'> | null>;
    visitedByObjectId: Map<Id<'objects'>, boolean>;
};

type VisitedPairGroup = {
    userId: Id<'users'>;
    chunkId: string;
    objectIds: Id<'objects'>[];
};

export async function loadSyncSnapshotExtras(
    ctx: QueryCtx,
    objects: Doc<'objects'>[],
): Promise<SyncSnapshotExtras> {
    if (objects.length === 0) {
        return {syncByObjectId: new Map(), visitedByObjectId: new Map()};
    }
    const [syncByObjectId, visitedByObjectId] = await Promise.all([
        loadSyncRecords(ctx, objects),
        loadVisitedFlags(ctx, objects),
    ]);
    return {syncByObjectId, visitedByObjectId};
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
