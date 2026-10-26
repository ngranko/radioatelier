import {describe, expect, it, vi} from 'vitest';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {matchIndexRange, type IndexRange} from './mockIndexRange';
import {
    countPrivateTagUsage,
    countSharedTaxonomyUsage,
    moveCategoryBatch,
    rebuildIdList,
    replaceTagBatch,
} from './objectTaxonomy';

const categoryId = 'category-1' as Id<'categories'>;
const otherCategoryId = 'category-2' as Id<'categories'>;
const tagId = 'tag-1' as Id<'tags'>;
const otherTagId = 'tag-2' as Id<'tags'>;

type Row = Record<string, unknown>;

function createMockCtx(markers: Row[], privateTagRows: Row[] = []) {
    const tables: Record<string, Row[]> = {markers, objectPrivateTags: privateTagRows};
    const db = {
        query: vi.fn((table: string) => ({
            collect: async () => tables[table],
            paginate: async () => ({page: tables[table], isDone: true, continueCursor: 'end'}),
            withIndex: (_index: string, range: (q: IndexRange) => IndexRange) => ({
                collect: async () => tables[table].filter(matchIndexRange(range)),
                take: async (count: number) =>
                    tables[table].filter(matchIndexRange(range)).slice(0, count),
            }),
        })),
        patch: vi.fn(),
    };
    return {ctx: {db} as unknown as MutationCtx, db};
}

function createMarker(overrides: Record<string, unknown> = {}) {
    return {
        _id: 'marker-1',
        objectId: 'object-1',
        categoryId,
        tagIds: [tagId],
        ...overrides,
    };
}

describe('countSharedTaxonomyUsage', () => {
    it('counts markers from every owner, not only one user', async () => {
        const {ctx} = createMockCtx([
            createMarker({_id: 'marker-1', objectId: 'object-1'}),
            createMarker({_id: 'marker-2', objectId: 'object-2', tagIds: [tagId, otherTagId]}),
            createMarker({_id: 'marker-3', objectId: 'object-3', categoryId: otherCategoryId}),
        ]);

        const usage = await countSharedTaxonomyUsage(ctx);

        expect(usage.categories.get(categoryId)).toBe(2);
        expect(usage.categories.get(otherCategoryId)).toBe(1);
        expect(usage.tags.get(tagId)).toBe(3);
        expect(usage.tags.get(otherTagId)).toBe(1);
    });
});

describe('countPrivateTagUsage', () => {
    it('leaves out rows that belong to another user', async () => {
        const privateTagId = 'private-1' as Id<'privateTags'>;
        const {ctx} = createMockCtx(
            [],
            [
                {objectId: 'object-1', userId: 'user-1', privateTagIds: [privateTagId]},
                {objectId: 'object-2', userId: 'user-2', privateTagIds: [privateTagId]},
            ],
        );

        const usage = await countPrivateTagUsage(ctx, 'user-1' as Id<'users'>);

        expect(usage.get(privateTagId)).toBe(1);
    });
});

describe('moveCategoryBatch', () => {
    it('keeps the object and its marker on the same category', async () => {
        const {ctx, db} = createMockCtx([createMarker()]);

        const batch = await moveCategoryBatch(ctx, categoryId, otherCategoryId);

        expect(batch).toEqual({objectIds: ['object-1'], isDone: true});
        expect(db.patch).toHaveBeenCalledWith('markers', 'marker-1', {
            categoryId: otherCategoryId,
        });
        expect(db.patch).toHaveBeenCalledWith('objects', 'object-1', {
            categoryId: otherCategoryId,
        });
    });
});

describe('replaceTagBatch', () => {
    it('drops the tag when there is no replacement', async () => {
        const {ctx, db} = createMockCtx([createMarker({tagIds: [tagId, otherTagId]})]);

        await replaceTagBatch(ctx, tagId, null, null);

        expect(db.patch).toHaveBeenCalledWith('markers', 'marker-1', {tagIds: [otherTagId]});
    });
});

describe('rebuildIdList', () => {
    it('does not duplicate a replacement the object already carries', () => {
        expect(rebuildIdList([tagId, otherTagId], tagId, otherTagId)).toEqual([otherTagId]);
    });
});
