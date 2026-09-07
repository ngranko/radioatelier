import {describe, expect, it, vi} from 'vitest';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {
    countTaxonomyUsage,
    moveObjectsToCategory,
    rebuildIdList,
    replaceTagOnObjects,
} from './objectTaxonomy';

const categoryId = 'category-1' as Id<'categories'>;
const otherCategoryId = 'category-2' as Id<'categories'>;
const tagId = 'tag-1' as Id<'tags'>;
const otherTagId = 'tag-2' as Id<'tags'>;

function createMockCtx(markers: unknown[], privateTagRows: unknown[] = []) {
    const db = {
        query: vi.fn((table: string) => ({
            collect: vi.fn().mockResolvedValue(table === 'markers' ? markers : privateTagRows),
            filter: vi.fn().mockReturnValue({
                collect: vi
                    .fn()
                    .mockResolvedValue(
                        (markers as {categoryId: Id<'categories'>}[]).filter(
                            marker => marker.categoryId === categoryId,
                        ),
                    ),
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

describe('countTaxonomyUsage', () => {
    it('counts markers from every owner, not only one user', async () => {
        const {ctx} = createMockCtx(
            [
                createMarker({_id: 'marker-1', objectId: 'object-1'}),
                createMarker({_id: 'marker-2', objectId: 'object-2', tagIds: [tagId, otherTagId]}),
                createMarker({_id: 'marker-3', objectId: 'object-3', categoryId: otherCategoryId}),
            ],
            [{objectId: 'object-1', privateTagIds: ['private-1', 'private-1']}],
        );

        const usage = await countTaxonomyUsage(ctx);

        expect(usage.categories.get(categoryId)).toBe(2);
        expect(usage.categories.get(otherCategoryId)).toBe(1);
        expect(usage.tags.get(tagId)).toBe(3);
        expect(usage.tags.get(otherTagId)).toBe(1);
        expect(usage.privateTags.get('private-1' as Id<'privateTags'>)).toBe(1);
    });
});

describe('moveObjectsToCategory', () => {
    it('keeps the object and its marker on the same category', async () => {
        const {ctx, db} = createMockCtx([createMarker()]);

        const objectIds = await moveObjectsToCategory(ctx, categoryId, otherCategoryId);

        expect(objectIds).toEqual(['object-1']);
        expect(db.patch).toHaveBeenCalledWith('markers', 'marker-1', {
            categoryId: otherCategoryId,
        });
        expect(db.patch).toHaveBeenCalledWith('objects', 'object-1', {
            categoryId: otherCategoryId,
        });
    });
});

describe('replaceTagOnObjects', () => {
    it('drops the tag when there is no replacement', async () => {
        const {ctx, db} = createMockCtx([createMarker({tagIds: [tagId, otherTagId]})]);

        await replaceTagOnObjects(ctx, tagId, null);

        expect(db.patch).toHaveBeenCalledWith('markers', 'marker-1', {tagIds: [otherTagId]});
    });
});

describe('rebuildIdList', () => {
    it('does not duplicate a replacement the object already carries', () => {
        expect(rebuildIdList([tagId, otherTagId], tagId, otherTagId)).toEqual([otherTagId]);
    });
});
