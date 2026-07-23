import {beforeEach, describe, expect, it, vi} from 'vitest';
import {internal} from '../_generated/api';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {
    createObjectRecords,
    type ObjectRecordData,
    type ObjectTarget,
    patchObjectRecords,
} from './objectWriter';

vi.mock('./objectHelpers', () => ({
    getNextInternalId: vi.fn().mockResolvedValue('RA-7'),
}));

const ownerId = 'user-1' as Id<'users'>;
const categoryId = 'category-1' as Id<'categories'>;
const otherCategoryId = 'category-2' as Id<'categories'>;

function createMockCtx() {
    const db = {
        insert: vi
            .fn()
            .mockResolvedValueOnce('map-point-1')
            .mockResolvedValueOnce('object-1')
            .mockResolvedValueOnce('marker-1'),
        get: vi.fn().mockResolvedValue({_id: categoryId, name: 'mosaics'}),
        patch: vi.fn(),
    };
    const scheduler = {runAfter: vi.fn()};
    return {ctx: {db, scheduler} as unknown as MutationCtx, db, scheduler};
}

const createData: ObjectRecordData = {
    name: 'Mosaic',
    description: null,
    installedPeriod: null,
    removalPeriod: null,
    source: null,
    coverId: null,
    categoryId,
    tagIds: [],
    isPublic: true,
    isRemoved: false,
    latitude: 55.75,
    longitude: 37.61,
    address: 'Tverskaya 1',
    city: 'Moscow',
    country: 'Russia',
};

function createTarget(): ObjectTarget {
    return {
        object: {
            _id: 'object-1',
            mapPointId: 'map-point-1',
            name: 'Mosaic',
            description: null,
            installedPeriod: null,
            removalPeriod: null,
            source: null,
            coverId: null,
            categoryId,
            tagIds: [],
            isPublic: true,
            isRemoved: false,
            createdById: ownerId,
        },
        mapPoint: {
            _id: 'map-point-1',
            latitude: 55.75,
            longitude: 37.61,
            address: 'Tverskaya 1',
            city: 'Moscow',
            country: 'Russia',
        },
        category: {_id: categoryId, name: 'mosaics'},
        tags: [],
        marker: {
            _id: 'marker-1',
            latitude: 55.75,
            longitude: 37.61,
            categoryId,
            tagIds: [],
            isPublic: true,
            isRemoved: false,
        },
    } as unknown as ObjectTarget;
}

describe('createObjectRecords', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('schedules search indexing derived from the written records', async () => {
        const {ctx, scheduler} = createMockCtx();

        const {objectId} = await createObjectRecords(ctx, ownerId, createData);

        expect(objectId).toBe('object-1');
        expect(scheduler.runAfter).toHaveBeenCalledWith(0, internal.typesense.createInTypesense, {
            object: {
                id: 'object-1',
                name: 'Mosaic',
                address: 'Tverskaya 1',
                city: 'Moscow',
                country: 'Russia',
                categoryName: 'mosaics',
                location: [55.75, 37.61],
                createdBy: ownerId,
                isPublic: true,
            },
        });
    });

    it('rejects unknown categories before writing anything', async () => {
        const {ctx, db, scheduler} = createMockCtx();
        db.get.mockResolvedValue(null);

        await expect(createObjectRecords(ctx, ownerId, createData)).rejects.toThrow(
            'Category not found',
        );
        expect(db.insert).not.toHaveBeenCalled();
        expect(scheduler.runAfter).not.toHaveBeenCalled();
    });
});

describe('patchObjectRecords', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('skips writes and search indexing when nothing changed', async () => {
        const {ctx, db, scheduler} = createMockCtx();

        await patchObjectRecords(ctx, createTarget(), {
            name: 'Mosaic',
            latitude: 55.75,
        });

        expect(db.patch).not.toHaveBeenCalled();
        expect(scheduler.runAfter).not.toHaveBeenCalled();
    });

    it('schedules a search update merging the patch over current state', async () => {
        const {ctx, db, scheduler} = createMockCtx();

        await patchObjectRecords(ctx, createTarget(), {name: 'Plaque'});

        expect(db.patch).toHaveBeenCalledWith('objects', 'object-1', {name: 'Plaque'});
        expect(scheduler.runAfter).toHaveBeenCalledWith(
            0,
            internal.typesense.updateInTypesense,
            expect.objectContaining({
                object: expect.objectContaining({
                    id: 'object-1',
                    name: 'Plaque',
                    address: 'Tverskaya 1',
                    categoryName: 'mosaics',
                }),
            }),
        );
    });

    it('re-resolves the category name when the patch changes the category', async () => {
        const {ctx, db, scheduler} = createMockCtx();
        db.get.mockResolvedValue({_id: otherCategoryId, name: 'signs'});

        await patchObjectRecords(ctx, createTarget(), {categoryId: otherCategoryId});

        expect(db.get).toHaveBeenCalledWith('categories', otherCategoryId);
        expect(scheduler.runAfter).toHaveBeenCalledWith(
            0,
            internal.typesense.updateInTypesense,
            expect.objectContaining({
                object: expect.objectContaining({categoryName: 'signs'}),
            }),
        );
    });

    it('indexes new coordinates after a reposition patch', async () => {
        const {ctx, db, scheduler} = createMockCtx();

        await patchObjectRecords(ctx, createTarget(), {latitude: 59.94, longitude: 30.31});

        expect(db.patch).toHaveBeenCalledWith('mapPoints', 'map-point-1', {
            latitude: 59.94,
            longitude: 30.31,
        });
        expect(db.patch).toHaveBeenCalledWith('markers', 'marker-1', {
            latitude: 59.94,
            longitude: 30.31,
        });
        expect(scheduler.runAfter).toHaveBeenCalledWith(
            0,
            internal.typesense.updateInTypesense,
            expect.objectContaining({
                object: expect.objectContaining({location: [59.94, 30.31]}),
            }),
        );
    });
});
