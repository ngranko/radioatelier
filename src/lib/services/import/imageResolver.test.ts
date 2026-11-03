import type {Id} from '$convex/_generated/dataModel';
import type {ConvexClient} from 'convex/browser';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {resolveImportImage} from './imageResolver';

vi.mock('$lib/utils/imageResizer', () => ({resizeImage: async (image: File) => image}));

const imageId = 'image-1' as Id<'images'>;
const uploadUrl = 'https://storage.test/upload';
const dataUrl = 'data:image/png;base64,aW1hZ2U=';

afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe('resolveImportImage', () => {
    it.each([dataUrl, 'https://source.test/image.png'])(
        'uploads independent images when rows reuse %s',
        async source => {
            const mutation = vi
                .fn<ConvexClient['mutation']>()
                .mockResolvedValueOnce(uploadUrl)
                .mockResolvedValueOnce({id: imageId, url: 'original', previewUrl: ''})
                .mockResolvedValueOnce(uploadUrl)
                .mockResolvedValueOnce({id: 'image-2', url: 'original-2', previewUrl: ''});
            const post = vi.fn<typeof fetch>(async url =>
                url === uploadUrl
                    ? Response.json({storageId: 'storage-1'})
                    : new Response('image', {headers: {'Content-Type': 'image/png'}}),
            );
            vi.stubGlobal('fetch', post);
            const client = {mutation} as unknown as ConvexClient;

            await expect(resolveImportImage(client, source)).resolves.toBe(imageId);
            await expect(resolveImportImage(client, source)).resolves.toBe('image-2');

            const uploads = post.mock.calls.filter(([url]) => url === uploadUrl);
            expect(uploads).toHaveLength(2);
            for (const [, request] of uploads) {
                expect(request?.headers).toEqual({'Content-Type': 'image/png'});
                expect(await new Response(request?.body).text()).toBe('image');
            }
        },
    );

    it('returns no image after an upload failure', async () => {
        const mutation = vi.fn<ConvexClient['mutation']>().mockResolvedValueOnce(uploadUrl);
        const post = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('', {status: 500}));
        vi.stubGlobal('fetch', post);
        vi.spyOn(console, 'warn').mockImplementation(() => {});

        await expect(
            resolveImportImage({mutation} as unknown as ConvexClient, dataUrl),
        ).resolves.toBeNull();
    });
});
