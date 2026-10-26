import {describe, expect, it, vi} from 'vitest';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {matchIndexRange, type IndexRange} from './mockIndexRange';
import {
    removeCategory,
    removePrivateTag,
    removeTag,
    renameCategory,
    renamePrivateTag,
    renameTag,
} from './taxonomyEditor';
import {scheduleTaxonomyFanout} from './taxonomyFanout';

vi.mock('./taxonomyFanout', () => ({scheduleTaxonomyFanout: vi.fn()}));

const categoryId = 'category-1' as Id<'categories'>;
const replacementCategoryId = 'category-2' as Id<'categories'>;
const tagId = 'tag-1' as Id<'tags'>;
const privateTagId = 'private-1' as Id<'privateTags'>;
const ownerId = 'user-1' as Id<'users'>;

type Row = Record<string, unknown>;

interface MockOptions {
    docs?: Record<string, unknown>;
    rows?: Record<string, Row[]>;
}

function createMockCtx({docs = {}, rows = {}}: MockOptions) {
    vi.mocked(scheduleTaxonomyFanout).mockClear();
    const db = {
        get: vi.fn((table: string, id: string) => Promise.resolve(docs[`${table}:${id}`] ?? null)),
        query: vi.fn((table: string) => {
            const tableRows = rows[table] ?? [];
            return {
                withIndex: (_index: string, range: (q: IndexRange) => IndexRange) => {
                    const matched = tableRows.filter(matchIndexRange(range));
                    return {first: async () => matched[0] ?? null, collect: async () => matched};
                },
                collect: async () => tableRows,
            };
        }),
        patch: vi.fn(),
        delete: vi.fn(),
    };
    const scheduler = {runAfter: vi.fn()};
    return {ctx: {db, scheduler} as unknown as MutationCtx, db, scheduler};
}

describe('renaming', () => {
    it('refuses a name another taxonomy of the same kind already holds', async () => {
        const {ctx} = createMockCtx({
            docs: {'tags:tag-1': {_id: tagId, name: 'mosaic'}},
            rows: {tags: [{_id: 'tag-9', name: 'mural'}]},
        });

        await expect(renameTag(ctx, tagId, ' Mural ')).rejects.toMatchObject({
            data: {code: 'nameTaken'},
        });
    });

    it('refuses a category name that differs from a legacy lowercase one only by case', async () => {
        const {ctx} = createMockCtx({
            docs: {'categories:category-1': {_id: categoryId, name: 'Mural'}},
            rows: {categories: [{_id: replacementCategoryId, name: 'mosaic'}]},
        });

        await expect(renameCategory(ctx, categoryId, 'MOSAIC')).rejects.toMatchObject({
            data: {code: 'nameTaken'},
        });
    });

    it('lets a legacy lowercase category take on its capitalized form', async () => {
        const legacyCategory = {_id: categoryId, name: 'mosaic'};
        const {ctx, db} = createMockCtx({
            docs: {'categories:category-1': legacyCategory},
            rows: {categories: [legacyCategory]},
        });

        await renameCategory(ctx, categoryId, 'mosaic');

        expect(db.patch).toHaveBeenCalledWith('categories', categoryId, {name: 'Mosaic'});
    });

    it('leaves a name that normalizes to itself untouched and resyncs nothing', async () => {
        const {ctx, db} = createMockCtx({
            docs: {'tags:tag-1': {_id: tagId, name: 'mosaic'}},
            rows: {markers: [{_id: 'marker-1', objectId: 'object-1', tagIds: [tagId]}]},
        });

        await renameTag(ctx, tagId, ' Mosaic ');

        expect(db.patch).not.toHaveBeenCalled();
        expect(scheduleTaxonomyFanout).not.toHaveBeenCalled();
    });

    it('normalizes the new name and resyncs the objects that carry it', async () => {
        const {ctx, db} = createMockCtx({
            docs: {'tags:tag-1': {_id: tagId, name: 'mosaic'}},
            rows: {markers: [{_id: 'marker-1', objectId: 'object-1', tagIds: [tagId]}]},
        });

        await renameTag(ctx, tagId, ' Mural ');

        expect(db.patch).toHaveBeenCalledWith('tags', tagId, {name: 'mural'});
        expect(scheduleTaxonomyFanout).toHaveBeenCalledWith(ctx, ['object-1'], null);
    });

    it("reports another user's private tag as missing", async () => {
        const {ctx, db} = createMockCtx({
            docs: {
                'privateTags:private-1': {_id: privateTagId, name: 'mine', createdById: 'user-2'},
            },
        });

        await expect(renamePrivateTag(ctx, ownerId, privateTagId, 'ours')).rejects.toMatchObject({
            data: {code: 'notFound'},
        });
        expect(db.patch).not.toHaveBeenCalled();
    });
});

describe('removal', () => {
    it('refuses to drop a category that objects still depend on', async () => {
        const {ctx} = createMockCtx({
            docs: {'categories:category-1': {_id: categoryId, name: 'Mosaic'}},
            rows: {markers: [{_id: 'marker-1', objectId: 'object-1', categoryId}]},
        });

        await expect(removeCategory(ctx, categoryId, null)).rejects.toMatchObject({
            data: {code: 'categoryInUse'},
        });
    });

    it('leaves a replaced category in place until the batched move deletes it', async () => {
        const {ctx, db, scheduler} = createMockCtx({
            docs: {
                'categories:category-1': {_id: categoryId, name: 'Mosaic'},
                'categories:category-2': {_id: replacementCategoryId, name: 'Mural'},
            },
            rows: {markers: [{_id: 'marker-1', objectId: 'object-1', categoryId}]},
        });

        await removeCategory(ctx, categoryId, replacementCategoryId);

        expect(scheduler.runAfter).toHaveBeenCalledWith(0, expect.anything(), {
            categoryId,
            replacementId: replacementCategoryId,
        });
        expect(db.patch).toHaveBeenCalledWith('categories', categoryId, {
            isDeleting: true,
            deletionReplacementId: replacementCategoryId,
        });
        expect(db.delete).not.toHaveBeenCalled();
    });

    it('drops an unused category together with its marker styles', async () => {
        const {ctx, db} = createMockCtx({
            docs: {'categories:category-1': {_id: categoryId, name: 'Mosaic'}},
            rows: {userCategoryMarkerStyles: [{_id: 'style-1', categoryId}]},
        });

        await removeCategory(ctx, categoryId, null);

        expect(db.delete).toHaveBeenCalledWith('userCategoryMarkerStyles', 'style-1');
        expect(db.delete).toHaveBeenCalledWith('categories', categoryId);
    });

    it('refuses to merge a private tag into one its owner does not hold', async () => {
        const foreignTagId = 'private-2' as Id<'privateTags'>;
        const {ctx, db} = createMockCtx({
            docs: {
                'privateTags:private-1': {_id: privateTagId, name: 'mine', createdById: ownerId},
                'privateTags:private-2': {_id: foreignTagId, name: 'theirs', createdById: 'user-2'},
            },
        });

        await expect(
            removePrivateTag(ctx, ownerId, privateTagId, foreignTagId),
        ).rejects.toMatchObject({data: {code: 'notFound'}});
        expect(db.delete).not.toHaveBeenCalled();
    });
});

describe('concurrent taxonomy edits', () => {
    it.each(['categories', 'tags'] as const)('blocks edits to deleting %s', async table => {
        const {ctx, db, scheduler} = createMockCtx({
            docs: {[`${table}:pending`]: {_id: 'pending', name: 'old', isDeleting: true}},
        });
        const rename = table === 'categories' ? renameCategory : renameTag;
        const remove = table === 'categories' ? removeCategory : removeTag;
        await expect(rename(ctx, 'pending' as never, 'new')).rejects.toMatchObject({
            data: {code: 'deletionInProgress'},
        });
        await expect(remove(ctx, 'pending' as never, null)).rejects.toMatchObject({
            data: {code: 'deletionInProgress'},
        });
        expect(db.patch).not.toHaveBeenCalled();
        expect(scheduler.runAfter).not.toHaveBeenCalled();
    });

    it.each(['categories', 'tags'] as const)(
        'refuses deleting %s as a migration destination',
        async table => {
            const {ctx, db, scheduler} = createMockCtx({
                docs: {
                    [`${table}:source`]: {_id: 'source', name: 'old'},
                    [`${table}:target`]: {_id: 'target', name: 'new', isDeleting: true},
                },
            });
            const remove = table === 'categories' ? removeCategory : removeTag;
            await expect(remove(ctx, 'source' as never, 'target' as never)).rejects.toMatchObject({
                data: {code: 'deletionInProgress'},
            });
            expect(db.patch).not.toHaveBeenCalled();
            expect(scheduler.runAfter).not.toHaveBeenCalled();
        },
    );

    it.each(['categories', 'tags'] as const)(
        'keeps %s migration destinations until incoming work finishes',
        async table => {
            const {ctx, db, scheduler} = createMockCtx({
                docs: {[`${table}:target`]: {_id: 'target', name: 'new'}},
                rows: {
                    [table]: [{_id: 'source', isDeleting: true, deletionReplacementId: 'target'}],
                },
            });
            const remove = table === 'categories' ? removeCategory : removeTag;
            await expect(remove(ctx, 'target' as never, null)).rejects.toMatchObject({
                data: {code: 'migrationInProgress'},
            });
            expect(db.delete).not.toHaveBeenCalled();
            expect(scheduler.runAfter).not.toHaveBeenCalled();
        },
    );

    it('marks tags before scheduling their removal', async () => {
        const {ctx, db, scheduler} = createMockCtx({
            docs: {'tags:tag-1': {_id: tagId, name: 'old'}},
        });
        await removeTag(ctx, tagId, null);
        expect(db.patch).toHaveBeenCalledWith('tags', tagId, {
            isDeleting: true,
            deletionReplacementId: undefined,
        });
        expect(scheduler.runAfter).toHaveBeenCalledWith(0, expect.anything(), {
            tagId,
            replacementId: null,
            cursor: null,
        });
    });
});
