import {describe, expect, it, vi} from 'vitest';
import type {Doc, Id} from '../_generated/dataModel';
import {loadObjectAggregate, loadObjectAggregates} from './objectReader';

type ReaderCtx = Parameters<typeof loadObjectAggregates>[0];

const mapPoint = {_id: 'map-1', latitude: 55.75, longitude: 37.61} as Doc<'mapPoints'>;
const category = {_id: 'category-1', name: 'mosaics'} as Doc<'categories'>;
const firstTag = {_id: 'tag-1', name: 'sound'} as Doc<'tags'>;
const secondTag = {_id: 'tag-2', name: 'historic'} as Doc<'tags'>;

function makeObject(objectId: string): Doc<'objects'> {
    return {
        _id: objectId,
        mapPointId: 'map-1',
        categoryId: 'category-1',
        tagIds: ['tag-1', 'tag-2'],
    } as unknown as Doc<'objects'>;
}

function makeCtx(docs: Record<string, unknown>) {
    const get = vi.fn(async (_table: string, docId: string) => docs[docId] ?? null);
    return {ctx: {db: {get}} as unknown as ReaderCtx, get};
}

const allDocs = {
    'map-1': mapPoint,
    'category-1': category,
    'tag-1': firstTag,
    'tag-2': secondTag,
};

describe('loadObjectAggregates', () => {
    it('dedupes relation reads across objects', async () => {
        const {ctx, get} = makeCtx(allDocs);
        const objects = Array.from({length: 5}, (_, index) => makeObject(`object-${index + 1}`));

        const aggregates = await loadObjectAggregates(ctx, objects);

        expect(aggregates.size).toBe(5);
        expect(get).toHaveBeenCalledTimes(4);
    });

    it('keeps tags in the order the Object references them', async () => {
        const {ctx} = makeCtx(allDocs);

        const aggregates = await loadObjectAggregates(ctx, [makeObject('object-1')]);

        expect(aggregates.get('object-1' as Id<'objects'>)?.tags).toEqual([firstTag, secondTag]);
    });

    it('omits deleted tags without invalidating the aggregate', async () => {
        const {ctx} = makeCtx({...allDocs, 'tag-1': null});

        const aggregate = await loadObjectAggregate(ctx, makeObject('object-1'));

        expect(aggregate?.tags).toEqual([secondTag]);
    });

    it('invalidates the aggregate when the map point is missing', async () => {
        const {ctx} = makeCtx({...allDocs, 'map-1': null});

        expect(await loadObjectAggregate(ctx, makeObject('object-1'))).toBeNull();
    });

    it('invalidates the aggregate when the category is missing', async () => {
        const {ctx} = makeCtx({...allDocs, 'category-1': null});

        expect(await loadObjectAggregate(ctx, makeObject('object-1'))).toBeNull();
    });
});
