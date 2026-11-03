import {api} from '$convex/_generated/api';
import type {Id} from '$convex/_generated/dataModel';
import {getFunctionName} from 'convex/server';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {uploadImage, uploadImagePreview} from './imageUpload';

type UploadClient = Parameters<typeof uploadImage>[0];
const imageId = 'image-1' as Id<'images'>;
const storageId = 'storage-1';
const uploadUrl = 'https://storage.test/upload';
const image = new Blob(['image bytes'], {type: 'image/png'});

const operations = [
    {
        name: 'uploadImage',
        upload: uploadImage,
        commit: api.images.create,
        args: {storageId},
        result: {id: imageId, url: 'https://storage.test/original', previewUrl: ''},
    },
    {
        name: 'uploadImagePreview',
        upload: (client: UploadClient, image: Blob) => uploadImagePreview(client, imageId, image),
        commit: api.images.updatePreview,
        args: {id: imageId, storageId},
        result: {id: imageId, previewUrl: 'https://storage.test/preview'},
    },
];

function prepareUpload() {
    const mutation = vi.fn<UploadClient['mutation']>().mockResolvedValueOnce(uploadUrl);
    const post = vi.fn<typeof fetch>().mockResolvedValue(Response.json({storageId}));
    vi.stubGlobal('fetch', post);
    return {client: {mutation}, mutation, post};
}

afterEach(() => vi.unstubAllGlobals());

describe.each(operations)('$name', ({upload, commit, args, result}) => {
    it('uploads the prepared image and returns the committed result', async () => {
        const {client, mutation, post} = prepareUpload();
        mutation.mockResolvedValueOnce(result);

        await expect(upload(client, image)).resolves.toEqual(result);

        expect(getFunctionName(mutation.mock.calls[0][0])).toBe('images:generateUploadUrl');
        expect(post).toHaveBeenCalledExactlyOnceWith(uploadUrl, {
            method: 'POST',
            headers: {'Content-Type': image.type},
            body: image,
        });
        expect(mutation).toHaveBeenCalledTimes(2);
        expect(getFunctionName(mutation.mock.calls[1][0])).toBe(getFunctionName(commit));
        expect(mutation.mock.calls[1][1]).toEqual(args);
    });

    it('waits for the upload before committing the image', async () => {
        const {client, mutation, post} = prepareUpload();
        const response = Promise.withResolvers<Response>();
        post.mockReturnValueOnce(response.promise);
        mutation.mockResolvedValueOnce(result);

        const pending = upload(client, image);
        await vi.waitFor(() => expect(post).toHaveBeenCalledTimes(1));
        expect(mutation).toHaveBeenCalledTimes(1);

        response.resolve(Response.json({storageId}));
        await expect(pending).resolves.toEqual(result);
    });

    it('propagates URL acquisition failure without uploading or retrying', async () => {
        const {client, mutation, post} = prepareUpload();
        const error = new Error('not authenticated');
        mutation.mockReset().mockRejectedValueOnce(error);

        await expect(upload(client, image)).rejects.toThrow(error.message);

        expect(mutation).toHaveBeenCalledTimes(1);
        expect(post).not.toHaveBeenCalled();
    });

    it('rejects unsuccessful uploads even when their body contains a storage ID', async () => {
        const {client, mutation, post} = prepareUpload();
        post.mockResolvedValueOnce(Response.json({storageId}, {status: 500}));

        await expect(upload(client, image)).rejects.toThrow();

        expect(mutation).toHaveBeenCalledTimes(1);
        expect(post).toHaveBeenCalledTimes(1);
    });

    it('propagates network failures without committing or retrying', async () => {
        const {client, mutation, post} = prepareUpload();
        const error = new Error('network failed');
        post.mockRejectedValueOnce(error);

        await expect(upload(client, image)).rejects.toThrow(error.message);

        expect(mutation).toHaveBeenCalledTimes(1);
        expect(post).toHaveBeenCalledTimes(1);
    });

    it.each([null, {}, {storageId: 123}, {storageId: ''}, {storageId: '   '}])(
        'rejects an invalid storage payload %j without committing',
        async payload => {
            const {client, mutation, post} = prepareUpload();
            post.mockResolvedValueOnce(Response.json(payload));

            await expect(upload(client, image)).rejects.toThrow();

            expect(mutation).toHaveBeenCalledTimes(1);
            expect(post).toHaveBeenCalledTimes(1);
        },
    );

    it('propagates commit failures without retrying the upload or commit', async () => {
        const {client, mutation, post} = prepareUpload();
        const error = new Error('commit failed');
        mutation.mockRejectedValueOnce(error);

        await expect(upload(client, image)).rejects.toThrow(error.message);

        expect(mutation).toHaveBeenCalledTimes(2);
        expect(post).toHaveBeenCalledTimes(1);
    });
});
