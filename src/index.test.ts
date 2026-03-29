import {readExifOrientation} from '$lib/utils/image/exif';
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
        expect(drawImage).toHaveBeenNthCalledWith(1, {tag: 'raw-phone-jpeg'}, 0, 0, 1024, 768);
        expect(setTransform).toHaveBeenCalledWith(0, 1, -1, 0, 768, 0);
        expect(result.name).toBe('portrait.jpg');
        expect(result.type).toBe('image/jpeg');
    });
});

describe('readExifOrientation', () => {
    it('finds orientation in a later APP1 EXIF segment', async () => {
        const bytes = new Uint8Array([
            0xff,
            0xd8,
            0xff,
            0xe1,
            0x00,
            0x0a,
            0x48,
            0x65,
            0x6c,
            0x6c,
            0x6f,
            0x21,
            0xff,
            0xe1,
            0x00,
            0x22,
            0x45,
            0x78,
            0x69,
            0x66,
            0x00,
            0x00,
            0x4d,
            0x4d,
            0x00,
            0x2a,
            0x00,
            0x00,
            0x00,
            0x08,
            0x00,
            0x01,
            0x01,
            0x12,
            0x00,
            0x03,
            0x00,
            0x00,
            0x00,
            0x01,
            0x00,
            0x06,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0x00,
            0xff,
            0xd9,
        ]);
        const file = new File([bytes], 'portrait.jpg', {type: 'image/jpeg'});

        await expect(readExifOrientation(file)).resolves.toBe(6);
    });
});
