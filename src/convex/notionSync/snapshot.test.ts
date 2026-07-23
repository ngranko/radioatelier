import {afterEach, describe, expect, it, vi} from 'vitest';
import type {Doc, Id} from '../_generated/dataModel';
import type {QueryCtx} from '../_generated/server';
import type {ObjectAggregate} from '../helpers/objectReader';
import * as visitedChunks from '../utils/visitedChunks';
import {assembleObjectSnapshot} from './snapshot';
import {loadSyncSnapshotExtras} from './snapshotExtras';

process.env.NOTION_SYNC_APP_URL = 'https://radioatelier.app';

describe('notion snapshot assembly', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('assembles a snapshot from an Object aggregate and sync extras', () => {
        const aggregate: ObjectAggregate = {
            object: makeObject('object-1', id('users', 'owner-1')),
            mapPoint: makeMapPoint('map-1'),
            category: makeCategory('category-1', 'installation'),
            tags: [makeTag('tag-1', 'sound')],
        };

        expect(
            assembleObjectSnapshot(aggregate, {
                owner: makeOwner('owner-1'),
                sync: null,
                isVisited: true,
            }),
        ).toEqual({
            objectId: id('objects', 'object-1'),
            owner: {
                _id: id('users', 'owner-1'),
                notionSyncEnabled: true,
            },
            sync: null,
            fields: expect.objectContaining({
                name: 'Radio House',
                categoryName: 'installation',
                internalId: 'RA-1',
                tagNames: ['sound'],
                isVisited: true,
            }),
        });
    });

    it('dedupes visited chunk lookups by user and chunk', async () => {
        vi.spyOn(visitedChunks, 'getVisitedChunkId').mockReturnValue('abc');
        const owner = makeOwner('owner-1');
        const objects = [makeObject('object-1', owner._id), makeObject('object-2', owner._id)];

        const {ctx, stats} = createMockQueryCtx({
            syncByObjectId: objects.map(object => [object._id, null] as const),
            visitedChunks: [
                {
                    userId: owner._id,
                    chunkId: 'abc',
                    visitedObjectIds: [objects[0]._id],
                },
            ],
        });

        const extras = await loadSyncSnapshotExtras(ctx, objects);

        expect(stats.queryCalls).toBe(objects.length + 1);
        expect(extras.visitedByObjectId.get(objects[0]._id)).toBe(true);
        expect(extras.visitedByObjectId.get(objects[1]._id)).toBe(false);
    });
});

type MockDbSeed = {
    syncByObjectId: ReadonlyArray<readonly [Id<'objects'>, Doc<'objectNotionSync'> | null]>;
    visitedChunks: Array<{
        userId: Id<'users'>;
        chunkId: string;
        visitedObjectIds: Id<'objects'>[];
    }>;
};

function createMockQueryCtx(seed: MockDbSeed) {
    const stats = {
        queryCalls: 0,
    };
    const db = {
        query: vi.fn((table: string) => {
            if (table === 'objectNotionSync') {
                return createSyncQuery(seed, stats);
            }
            if (table === 'userVisitedChunks') {
                return createVisitedQuery(seed, stats);
            }
            throw new Error(`Unexpected query table: ${table}`);
        }),
    };

    return {
        ctx: {db} as unknown as QueryCtx,
        stats,
    };
}

function createSyncQuery(seed: MockDbSeed, stats: {queryCalls: number}) {
    let objectId: Id<'objects'> | null = null;
    return {
        withIndex: vi.fn((_index: string, builder: (q: IndexBuilder) => IndexBuilder) => {
            const query = builder(createIndexBuilder());
            objectId = (query.fieldValues.objectId as Id<'objects'>) ?? null;
            return {
                unique: vi.fn(async () => {
                    stats.queryCalls += 1;
                    if (!objectId) {
                        return null;
                    }
                    return seed.syncByObjectId.find(([id]) => id === objectId)?.[1] ?? null;
                }),
            };
        }),
    };
}

function createVisitedQuery(seed: MockDbSeed, stats: {queryCalls: number}) {
    let userId: Id<'users'> | null = null;
    let chunkId: string | null = null;
    return {
        withIndex: vi.fn((_index: string, builder: (q: IndexBuilder) => IndexBuilder) => {
            const query = builder(createIndexBuilder());
            userId = (query.fieldValues.userId as Id<'users'>) ?? null;
            chunkId = query.fieldValues.chunkId ?? null;
            return {
                unique: vi.fn(async () => {
                    stats.queryCalls += 1;
                    const match = seed.visitedChunks.find(
                        item => item.userId === userId && item.chunkId === chunkId,
                    );
                    if (!match) {
                        return null;
                    }
                    return {
                        _id: id('userVisitedChunks', `${userId}-${chunkId}`),
                        _creationTime: 0,
                        userId: match.userId,
                        chunkId: match.chunkId,
                        visitedObjectIds: match.visitedObjectIds,
                    };
                }),
            };
        }),
    };
}

type IndexBuilder = {
    eq: (field: string, value: string) => IndexBuilder;
    fieldValues: Record<string, string>;
};

function createIndexBuilder(): IndexBuilder {
    const fieldValues: Record<string, string> = {};
    const builder: IndexBuilder = {
        fieldValues,
        eq(field, value) {
            fieldValues[field] = value;
            return builder;
        },
    };
    return builder;
}

function makeOwner(ownerId: string): Doc<'users'> {
    return {
        _id: id('users', ownerId),
        _creationTime: 0,
        email: `${ownerId}@example.com`,
        externalId: `${ownerId}-external`,
        role: 'user',
        isDeleted: false,
        notionSyncEnabled: true,
    };
}

function makeMapPoint(mapPointId: string): Doc<'mapPoints'> {
    return {
        _id: id('mapPoints', mapPointId),
        _creationTime: 0,
        latitude: 48.8566,
        longitude: 2.3522,
        address: 'Rue Example',
        city: 'Paris',
        country: 'France',
    };
}

function makeCategory(categoryId: string, name: string): Doc<'categories'> {
    return {
        _id: id('categories', categoryId),
        _creationTime: 0,
        name,
        markerColor: '#000000',
        markerIcon: 'pin',
    };
}

function makeTag(tagId: string, name: string): Doc<'tags'> {
    return {
        _id: id('tags', tagId),
        _creationTime: 0,
        name,
    };
}

function makeObject(objectIdValue: string, ownerId: Id<'users'>): Doc<'objects'> {
    return {
        _id: id('objects', objectIdValue),
        _creationTime: 0,
        name: 'Radio House',
        description: null,
        installedPeriod: '2020',
        isRemoved: false,
        removalPeriod: null,
        source: 'https://example.com',
        coverId: null,
        categoryId: id('categories', 'category-1'),
        isPublic: false,
        tagIds: [id('tags', 'tag-1')],
        mapPointId: id('mapPoints', 'map-1'),
        createdById: ownerId,
        internalId: 'RA-1',
    };
}

function id<
    TableName extends
        | 'objects'
        | 'users'
        | 'mapPoints'
        | 'categories'
        | 'tags'
        | 'userVisitedChunks',
>(_table: TableName, value: string) {
    return value as Id<TableName>;
}
