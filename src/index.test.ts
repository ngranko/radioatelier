import * as io from '$lib/utils/image/resizer/io';
import {createImageResizer} from '$lib/utils/imageResizer';
import {afterEach, beforeEach, describe, expect, it, type MockInstance, vi} from 'vitest';

describe('createImageResizer', () => {
    let decodeSpy: MockInstance<typeof io.decodeImageFile>;
    let originalCreateImageBitmap: typeof globalThis.createImageBitmap;

    beforeEach(() => {
        originalCreateImageBitmap = globalThis.createImageBitmap;
        decodeSpy = vi.spyOn(io, 'decodeImageFile');
    });

    afterEach(() => {
        decodeSpy.mockRestore();
        globalThis.createImageBitmap = originalCreateImageBitmap;
    });

    it('applies EXIF orientation to raw portrait uploads once', async () => {
        const bitmapClose = vi.fn();
        globalThis.createImageBitmap = vi.fn(async () => ({
            width: 4032,
            height: 3024,
            close: bitmapClose,
        })) as unknown as typeof createImageBitmap;

        const drawImage = vi.fn();
        const setTransform = vi.fn();
        const save = vi.fn();
        const restore = vi.fn();

        const createCanvas = vi.fn((width: number, height: number) => ({
            width,
            height,
            getContext: vi.fn(() => ({
                drawImage,
                setTransform,
                save,
                restore,
            })),
        })) as unknown as (width: number, height: number) => HTMLCanvasElement;

        const resizeImage = createImageResizer({
            readOrientation: vi.fn().mockResolvedValue(6),
            decodeImage: io.decodeImageFile,
            createCanvas,
            toBlob: vi.fn().mockResolvedValue(new Blob(['mock'], {type: 'image/jpeg'})),
            now: vi.fn().mockReturnValue(123),
        });

        const file = new File(['mock'], 'portrait.jpg', {
            type: 'image/jpeg',
            lastModified: 1,
        });
        const result = await resizeImage(file);

        expect(decodeSpy).toHaveBeenCalledTimes(1);
        expect(decodeSpy).toHaveBeenCalledWith(file);
        expect(bitmapClose).toHaveBeenCalledTimes(1);

        expect(createCanvas).toHaveBeenNthCalledWith(1, 1024, 768);
        expect(createCanvas).toHaveBeenNthCalledWith(2, 768, 1024);
        expect(drawImage).toHaveBeenNthCalledWith(
            1,
            expect.objectContaining({width: 4032, height: 3024}),
            0,
            0,
            1024,
            768,
        );
        expect(setTransform).toHaveBeenCalledWith(0, 1, -1, 0, 768, 0);
        expect(result.name).toBe('portrait.jpg');
        expect(result.type).toBe('image/jpeg');
    });
});
