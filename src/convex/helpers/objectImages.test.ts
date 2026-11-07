import {describe, expect, it, vi} from 'vitest';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {matchIndexRange, type IndexRange} from './mockIndexRange';
import {listObjectImages, replaceObjectImages} from './objectImages';

type Row = {_id: string; [field: string]: unknown};

const objectId = 'object-1' as Id<'objects'>;
const ownerId = 'owner' as Id<'users'>;

function createContext() {
    const rows: Record<string, Row[]> = {
        objects: [{_id: objectId, coverId: null}],
        images: [
            {_id: 'own', createdById: ownerId},
            {_id: 'foreign', createdById: 'someone-else'},
            {_id: 'held', createdById: ownerId},
        ],
        objectImages: [{_id: 'link-0', objectId: 'other-object', imageId: 'held', position: 0}],
    };
    const db = {
        get: vi.fn(
            async (table: string, id: string) => rows[table].find(r => r._id === id) ?? null,
        ),
        query: (table: string) => ({
            withIndex: (_name: string, range: (q: IndexRange) => IndexRange) => {
                const matches = () =>
                    rows[table]
                        .filter(matchIndexRange(range))
                        .sort((a, b) => Number(a.position) - Number(b.position));
                return {first: async () => matches()[0] ?? null, collect: async () => matches()};
            },
        }),
        insert: vi.fn(async (table: string, data: Record<string, unknown>) => {
            rows[table].push({...data, _id: `${table}-${rows[table].length}`});
        }),
        patch: vi.fn(async (table: string, id: string, patch: Record<string, unknown>) => {
            Object.assign(
                rows[table].find(row => row._id === id)!,
                patch,
            );
        }),
        delete: vi.fn(async (table: string, id: string) => {
            rows[table] = rows[table].filter(row => row._id !== id);
        }),
    };
    return {ctx: {db} as unknown as MutationCtx, rows};
}

async function saveGallery(ctx: MutationCtx, imageIds: string[]) {
    await replaceObjectImages(ctx, objectId, ownerId, imageIds as Id<'images'>[]);
    return (await listObjectImages(ctx, objectId)).map(image => image._id);
}

describe('replaceObjectImages', () => {
    it("attaches only the saver's free uploads and takes the cover from them", async () => {
        const {ctx, rows} = createContext();

        expect(await saveGallery(ctx, ['foreign', 'held', 'own'])).toEqual(['own']);
        expect(rows.objects[0].coverId).toBe('own');
    });

    it('clears the cover with the last image', async () => {
        const {ctx, rows} = createContext();
        await saveGallery(ctx, ['own']);

        expect(await saveGallery(ctx, [])).toEqual([]);
        expect(rows.objects[0].coverId).toBeNull();
    });
});
