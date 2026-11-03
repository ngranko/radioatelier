import {api} from '$convex/_generated/api';
import type {Id} from '$convex/_generated/dataModel';
import type {ConvexClient} from 'convex/browser';

type UploadClient = Pick<ConvexClient, 'mutation'>;

export async function uploadImage(client: UploadClient, image: Blob) {
    const storageId = await uploadToStorage(client, image);
    return client.mutation(api.images.create, {storageId});
}

export async function uploadImagePreview(client: UploadClient, id: Id<'images'>, preview: Blob) {
    const storageId = await uploadToStorage(client, preview);
    return client.mutation(api.images.updatePreview, {id, storageId});
}

async function uploadToStorage(client: UploadClient, image: Blob) {
    const uploadUrl = await client.mutation(api.images.generateUploadUrl, {});
    const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {'Content-Type': image.type},
        body: image,
    });
    return readStorageId(response);
}

async function readStorageId(response: Response): Promise<Id<'_storage'>> {
    if (!response.ok) {
        throw new Error('Не удалось загрузить изображение в хранилище');
    }
    const payload: unknown = await response.json();
    if (
        typeof payload !== 'object' ||
        payload === null ||
        !('storageId' in payload) ||
        typeof payload.storageId !== 'string' ||
        !payload.storageId.trim()
    ) {
        throw new Error('Не удалось получить ID загруженного изображения');
    }
    return payload.storageId as Id<'_storage'>;
}
