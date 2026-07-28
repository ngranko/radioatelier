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
        const {ctx, query} = createMockQueryCtx(objects[0]._id);

        const extras = await loadSyncSnapshotExtras(ctx, objects);

        expect(query).toHaveBeenCalledTimes(objects.length + 1);
        expect(extras.visitedByObjectId.get(objects[0]._id)).toBe(true);
        expect(extras.visitedByObjectId.get(objects[1]._id)).toBe(false);
    });
});

function createMockQueryCtx(visitedObjectId: Id<'objects'>) {
    const query = vi.fn((table: string) => ({
        withIndex: vi.fn((_index: string, buildIndex: (q: IndexBuilder) => IndexBuilder) => {
            buildIndex(createIndexBuilder());
            return {
                unique: vi.fn(async () => {
                    if (table === 'objectNotionSync') {
                        return null;
                    }
                    if (table === 'userVisitedChunks') {
                        return {visitedObjectIds: [visitedObjectId]};
                    }
                    throw new Error(`Unexpected query table: ${table}`);
                }),
            };
        }),
    }));
    return {ctx: {db: {query}} as unknown as QueryCtx, query};
}

type IndexBuilder = {
    eq: () => IndexBuilder;
};

function createIndexBuilder(): IndexBuilder {
    const builder: IndexBuilder = {eq: () => builder};
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
