import {describe, expect, it, vi} from 'vitest';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {removeTaxonomy, renameTaxonomy} from './taxonomyEditor';

const categoryId = 'category-1' as Id<'categories'>;
const replacementCategoryId = 'category-2' as Id<'categories'>;
const tagId = 'tag-1' as Id<'tags'>;

interface MockOptions {
    docs?: Record<string, unknown>;
    conflicts?: Record<string, unknown>;
    rows?: Record<string, unknown[]>;
}

function createMockCtx({docs = {}, conflicts = {}, rows = {}}: MockOptions) {
    const db = {
        get: vi.fn((table: string, id: string) => Promise.resolve(docs[`${table}:${id}`] ?? null)),
        query: vi.fn((table: string) => ({
            withIndex: () => ({first: () => Promise.resolve(conflicts[table] ?? null)}),
            filter: () => ({collect: () => Promise.resolve(rows[table] ?? [])}),
            collect: () => Promise.resolve(rows[table] ?? []),
        })),
        patch: vi.fn(),
        delete: vi.fn(),
        normalizeId: vi.fn((_table: string, id: string) => id),
    };
    return {ctx: {db} as unknown as MutationCtx, db};
}

describe('renameTaxonomy', () => {
    it('refuses a name another taxonomy of the same kind already holds', async () => {
        const {ctx} = createMockCtx({
            docs: {'tags:tag-1': {_id: tagId, name: 'mosaic'}},
            conflicts: {tags: {_id: 'tag-9', name: 'mural'}},
        });

        await expect(renameTaxonomy(ctx, {type: 'tag', id: tagId}, ' Mural ')).rejects.toThrow();
    });

    it('normalizes the new name and reports the objects to resync', async () => {
        const {ctx, db} = createMockCtx({
            docs: {'tags:tag-1': {_id: tagId, name: 'mosaic'}},
            rows: {markers: [{_id: 'marker-1', objectId: 'object-1', tagIds: [tagId]}]},
        });

        const result = await renameTaxonomy(ctx, {type: 'tag', id: tagId}, ' Mural ');

        expect(db.patch).toHaveBeenCalledWith('tags', tagId, {name: 'mural'});
        expect(result).toEqual({objectIds: ['object-1'], searchCategoryName: null});
    });
});

describe('removeTaxonomy', () => {
    it('refuses to drop a category that objects still depend on', async () => {
        const {ctx} = createMockCtx({
            docs: {'categories:category-1': {_id: categoryId, name: 'mosaic'}},
            rows: {markers: [{_id: 'marker-1', objectId: 'object-1', categoryId}]},
        });

        await expect(
            removeTaxonomy(ctx, {type: 'category', id: categoryId}, null),
        ).rejects.toThrow();
    });

    it('moves objects to the replacement category and reindexes them under its name', async () => {
        const {ctx, db} = createMockCtx({
            docs: {
                'categories:category-1': {_id: categoryId, name: 'mosaic'},
                'categories:category-2': {_id: replacementCategoryId, name: 'mural'},
            },
            rows: {
                markers: [{_id: 'marker-1', objectId: 'object-1', categoryId}],
                userCategoryMarkerStyles: [{_id: 'style-1'}],
            },
        });

        const result = await removeTaxonomy(
            ctx,
            {type: 'category', id: categoryId},
            replacementCategoryId,
        );

        expect(db.patch).toHaveBeenCalledWith('objects', 'object-1', {
            categoryId: replacementCategoryId,
        });
        expect(db.delete).toHaveBeenCalledWith('userCategoryMarkerStyles', 'style-1');
        expect(db.delete).toHaveBeenCalledWith('categories', categoryId);
        expect(result).toEqual({objectIds: ['object-1'], searchCategoryName: 'mural'});
    });
});
