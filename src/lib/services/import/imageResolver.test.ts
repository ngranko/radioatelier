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
        'uploads and caches the prepared image from %s',
        async source => {
            const mutation = vi
                .fn<ConvexClient['mutation']>()
                .mockResolvedValueOnce(uploadUrl)
                .mockResolvedValueOnce({id: imageId, url: 'original', previewUrl: ''});
            const post = vi.fn<typeof fetch>(async url =>
                url === uploadUrl
                    ? Response.json({storageId: 'storage-1'})
                    : new Response('image', {headers: {'Content-Type': 'image/png'}}),
            );
            vi.stubGlobal('fetch', post);
            const cache = new Map<string, Id<'images'>>();
            const client = {mutation} as unknown as ConvexClient;

            await expect(resolveImportImage(client, source, cache)).resolves.toBe(imageId);

            const [, request] = post.mock.calls.find(([url]) => url === uploadUrl)!;
            expect(request?.headers).toEqual({'Content-Type': 'image/png'});
            expect(await new Response(request?.body).text()).toBe('image');
            expect(cache.get(source)).toBe(imageId);
            const requests = post.mock.calls.length;
            const mutations = mutation.mock.calls.length;
            await expect(resolveImportImage(client, source, cache)).resolves.toBe(imageId);
            expect(mutation).toHaveBeenCalledTimes(mutations);
            expect(post).toHaveBeenCalledTimes(requests);
        },
    );

    it('returns no image after an upload failure and leaves the source uncached', async () => {
        const mutation = vi.fn<ConvexClient['mutation']>().mockResolvedValueOnce(uploadUrl);
        const post = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response('', {status: 500}));
        vi.stubGlobal('fetch', post);
        vi.spyOn(console, 'warn').mockImplementation(() => {});
        const cache = new Map<string, Id<'images'>>();

        await expect(
            resolveImportImage({mutation} as unknown as ConvexClient, dataUrl, cache),
        ).resolves.toBeNull();

        expect(cache.size).toBe(0);
    });
});
