import {describe, expect, it, vi} from 'vitest';
import {MAX_OBJECT_IMAGES} from '../../lib/utils/fieldLimits';
import type {Doc, Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {deleteUnusedImageFile, replaceImagePreview} from './imageStorage';
import {matchIndexRange, type IndexRange} from './mockIndexRange';
import {repairObjectGallery} from './objectImageRepair';
import {listObjectImages, replaceObjectImages} from './objectImages';

type Row = {_id: string; [field: string]: unknown};
type Link = {objectId: string; imageId: string; position: number};

function createObject(id: string): Doc<'objects'> {
    return {_id: id, createdById: `owner-${id}`, coverId: 'shared'} as Doc<'objects'>;
}

function createImage(overrides: Partial<Doc<'images'>> = {}): Doc<'images'> {
    return {
        _id: 'shared',
        originalStorageId: 'original',
        previewStorageId: 'preview',
        ...overrides,
    } as Doc<'images'>;
}

function createContext(images = [createImage()], links: Link[] = []) {
    const objects = [createObject('a'), createObject('b')];
    const objectImages = links.map((link, i) => ({...link, _id: `link-${i}`}));
    const rows: Record<string, Row[]> = {objects, images, objectImages};
    const db = {
        get: vi.fn(async (table: string, id: string) =>
            structuredClone(rows[table].find(r => r._id === id) ?? null),
        ),
        query: (table: string) => ({
            withIndex: (_name: string, range: (q: IndexRange) => IndexRange) => {
                // byObjectIdAndPosition returns a gallery in order
                const matches = () =>
                    rows[table]
                        .filter(matchIndexRange(range))
                        .sort((a, b) => Number(a.position ?? 0) - Number(b.position ?? 0));
                return {
                    take: async (n: number) => matches().slice(0, n),
                    first: async () => matches()[0] ?? null,
                    collect: async () => matches(),
                };
            },
        }),
        insert: vi.fn(async (table: string, data: Record<string, unknown>) => {
            const id = `${table}-${rows[table].length}`;
            rows[table].push({...data, _id: id});
            return id;
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
    const storage = {delete: vi.fn(), getUrl: vi.fn(async (id: string) => `https://files/${id}`)};
    return {ctx: {db, storage} as unknown as MutationCtx, db, storage, objects, rows};
}

function galleryIds(ctx: MutationCtx, object: Doc<'objects'>) {
    return listObjectImages(ctx, object._id).then(images => images.map(image => image._id));
}

describe('repairObjectGallery', () => {
    it('gives shared ownerless covers independent owned galleries and can be rerun', async () => {
        const {ctx, objects, rows} = createContext();
        for (const object of objects) {
            await repairObjectGallery(ctx, object);
        }
        expect(objects[0].coverId).not.toBe(objects[1].coverId);
        for (const object of objects) {
            expect(await listObjectImages(ctx, object._id)).toEqual([
                expect.objectContaining({
                    _id: object.coverId,
                    createdById: object.createdById,
                    originalStorageId: 'original',
                    previewStorageId: 'preview',
                }),
            ]);
            await repairObjectGallery(ctx, object);
        }
        expect(rows.images).toHaveLength(3);
    });

    it('swaps a cover held by two galleries for a copy in place', async () => {
        const {ctx, objects} = createContext(
            [createImage({createdById: 'owner-a' as Id<'users'>})],
            [
                {objectId: 'a', imageId: 'shared', position: 0},
                {objectId: 'b', imageId: 'shared', position: 0},
            ],
        );
        for (const object of objects) {
            await repairObjectGallery(ctx, object);
        }

        const [galleryA, galleryB] = await Promise.all(objects.map(o => galleryIds(ctx, o)));
        expect(galleryA).toEqual([objects[0].coverId]);
        expect(galleryB).toEqual([objects[1].coverId]);
        expect(objects[0].coverId).not.toBe(objects[1].coverId);
    });

    it('preserves the other gallery and keeps the repaired photo when reordered', async () => {
        const extra = createImage({_id: 'extra' as Id<'images'>});
        const {ctx, objects} = createContext(
            [createImage(), extra],
            [
                {objectId: 'a', imageId: 'shared', position: 0},
                {objectId: 'b', imageId: 'extra', position: 0},
            ],
        );
        await repairObjectGallery(ctx, objects[1]);
        const copyId = objects[1].coverId!;
        expect(await galleryIds(ctx, objects[1])).toEqual([copyId, extra._id]);

        await replaceObjectImages(ctx, objects[1]._id, objects[1].createdById, [extra._id, copyId]);

        expect(await galleryIds(ctx, objects[1])).toEqual([extra._id, copyId]);
        expect(await galleryIds(ctx, objects[0])).toEqual(['shared']);
    });

    it('fails before writing when a cover is missing or its gallery is full', async () => {
        const {ctx, db, objects, rows} = createContext([]);
        await expect(repairObjectGallery(ctx, objects[0])).rejects.toThrow('Missing cover');
        rows.images.push(createImage());
        for (let i = 0; i < MAX_OBJECT_IMAGES; i++) {
            rows.objectImages.push({_id: `link-${i}`, objectId: 'a', imageId: `extra-${i}`});
        }
        await expect(repairObjectGallery(ctx, objects[0])).rejects.toThrow('Gallery is full');
        expect(db.insert).not.toHaveBeenCalled();
        expect(db.patch).not.toHaveBeenCalled();
    });

    it('leaves Objects without covers and already independent covers unchanged', async () => {
        const {ctx, db, objects} = createContext(
            [createImage({createdById: 'owner-a' as Id<'users'>})],
            [{objectId: 'a', imageId: 'shared', position: 0}],
        );
        objects[1].coverId = null;
        await repairObjectGallery(ctx, objects[0]);
        await repairObjectGallery(ctx, objects[1]);
        expect(db.insert).not.toHaveBeenCalled();
        expect(db.patch).not.toHaveBeenCalled();
    });
});

describe('independent previews', () => {
    it('rejects preview changes from anyone except the image owner', async () => {
        const {ctx, db, storage} = createContext([
            createImage({createdById: 'owner-a' as Id<'users'>}),
        ]);
        await expect(
            replaceImagePreview(
                ctx,
                'owner-b' as Id<'users'>,
                'shared' as Id<'images'>,
                'new-preview' as Id<'_storage'>,
            ),
        ).rejects.toThrow('Image not found');
        expect(db.patch).not.toHaveBeenCalled();
        expect(storage.delete).not.toHaveBeenCalled();
    });

    it('keeps the other crop until the last image replaces it', async () => {
        const source = createImage({createdById: 'owner-a' as Id<'users'>});
        const {ctx, objects, rows, storage} = createContext(
            [source],
            [{objectId: 'a', imageId: 'shared', position: 0}],
        );
        await repairObjectGallery(ctx, objects[1]);
        for (const object of [objects[1], objects[0]]) {
            await replaceImagePreview(
                ctx,
                object.createdById,
                object.coverId!,
                `crop-${object._id}` as Id<'_storage'>,
            );
            if (object._id === 'b') {
                expect(source.previewStorageId).toBe('preview');
                expect(storage.delete).not.toHaveBeenCalled();
            }
        }
        expect(rows.images.map(image => image.previewStorageId)).toEqual(
            expect.arrayContaining(['crop-a', 'crop-b']),
        );
        expect(storage.delete).toHaveBeenCalledExactlyOnceWith('preview');
    });

    it('retains a file used as an original and collects it after all references disappear', async () => {
        const {ctx, rows, storage} = createContext();
        await deleteUnusedImageFile(ctx, 'original' as Id<'_storage'>);
        expect(storage.delete).not.toHaveBeenCalled();
        rows.images = [];
        await deleteUnusedImageFile(ctx, 'original' as Id<'_storage'>);
        expect(storage.delete).toHaveBeenCalledExactlyOnceWith('original');
    });
});
