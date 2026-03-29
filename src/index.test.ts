import {createImageResizer} from '$lib/utils/imageResizer';
import {describe, expect, it, vi} from 'vitest';

describe('createImageResizer', () => {
    it('applies EXIF orientation to raw portrait uploads once', async () => {
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
            decodeImage: vi.fn().mockResolvedValue({
                source: {tag: 'raw-phone-jpeg'} as unknown as CanvasImageSource,
                width: 4032,
                height: 3024,
                release: vi.fn(),
            }),
            createCanvas,
            toBlob: vi.fn().mockResolvedValue(new Blob(['mock'], {type: 'image/jpeg'})),
            now: vi.fn().mockReturnValue(123),
        });

        const result = await resizeImage(
            new File(['mock'], 'portrait.jpg', {type: 'image/jpeg', lastModified: 1}),
        );

        expect(createCanvas).toHaveBeenNthCalledWith(1, 1024, 768);
        expect(createCanvas).toHaveBeenNthCalledWith(2, 768, 1024);
        expect(drawImage).toHaveBeenNthCalledWith(
            1,
            {tag: 'raw-phone-jpeg'},
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
