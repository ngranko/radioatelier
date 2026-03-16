import type {Doc, Id} from '../_generated/dataModel';
import type {MutationCtx, QueryCtx} from '../_generated/server';
import {getVisitedChunkId} from '../utils/visitedChunks';

export async function getNextInternalId(ctx: MutationCtx) {
    let internalId = '';
    const internalIdCounter = await ctx.db
        .query('counters')
        .withIndex('byName', q => q.eq('name', 'internalId'))
        .first();

    if (internalIdCounter) {
        const newCounter = internalIdCounter.value + 1;
        internalId = `RA-${newCounter}`;

        await ctx.db.patch('counters', internalIdCounter._id, {
            value: newCounter,
        });
    } else {
        internalId = `RA-1`;

        await ctx.db.insert('counters', {
            name: 'internalId',
            value: 2,
        });
    }

    return internalId;
}

export async function getIsVisited(ctx: QueryCtx, objectId: Id<'objects'>, userId: Id<'users'>) {
    let isVisited = false;

    const chunkId = getVisitedChunkId(objectId);
    const visitedData = await ctx.db
        .query('userVisitedChunks')
        .withIndex('byUserIdAndChunkId', q => q.eq('userId', userId).eq('chunkId', chunkId))
        .unique();
    if (visitedData) {
        isVisited = visitedData.visitedObjectIds.includes(objectId);
    }

    return isVisited;
}

export async function getPrivateTags(ctx: QueryCtx, objectId: Id<'objects'>, userId: Id<'users'>) {
    const objectPrivateTags = await ctx.db
        .query('objectPrivateTags')
        .withIndex('byObjectIdUserId', q => q.eq('objectId', objectId).eq('userId', userId))
        .first();

    if (!objectPrivateTags) {
        return [];
    }

    return (
        await Promise.all(
            objectPrivateTags.privateTagIds.map(async item => ctx.db.get('privateTags', item)),
        )
    ).filter((tag): tag is Doc<'privateTags'> => tag !== null);
}

export async function updateIsVisited(
    ctx: MutationCtx,
    objectId: Id<'objects'>,
    userId: Id<'users'>,
    isVisited: boolean,
) {
    const chunkId = getVisitedChunkId(objectId);
    const visitedData = await ctx.db
        .query('userVisitedChunks')
        .withIndex('byUserIdAndChunkId', q => q.eq('userId', userId).eq('chunkId', chunkId))
        .unique();

    const wasVisited = visitedData?.visitedObjectIds.includes(objectId) ?? false;
    if (isVisited && !wasVisited) {
        if (visitedData) {
            await ctx.db.patch('userVisitedChunks', visitedData._id, {
                visitedObjectIds: [...visitedData.visitedObjectIds, objectId],
            });
        } else {
            await ctx.db.insert('userVisitedChunks', {
                userId: userId,
                chunkId,
                visitedObjectIds: [objectId],
            });
        }
    } else if (!isVisited && wasVisited && visitedData) {
        const newIds = visitedData.visitedObjectIds.filter(id => id !== objectId);
        if (newIds.length === 0) {
            await ctx.db.delete('userVisitedChunks', visitedData._id);
        } else {
            await ctx.db.patch('userVisitedChunks', visitedData._id, {
                visitedObjectIds: newIds,
            });
        }
    }
}
