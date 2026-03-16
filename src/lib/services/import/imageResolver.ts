import {api} from '$convex/_generated/api';
import type {Id} from '$convex/_generated/dataModel';
import {resizeImage} from '$lib/utils/imageResizer';
import type {ConvexClient} from 'convex/browser';

const ALLOWED_IMPORT_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

function base64ToBytes(base64: string) {
    const normalized = base64.includes(',') ? base64.split(',')[1] : base64;
    const binary = atob(normalized);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
        bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
}

function getMimeTypeFromDataUrl(source: string) {
    if (!source.startsWith('data:')) {
        return 'application/octet-stream';
    }
    const [meta] = source.split(',');
    const mime = meta.split(';')[0].replace('data:', '').trim();
    return mime || 'application/octet-stream';
}

function normalizeMimeType(contentType: string) {
    return contentType.toLowerCase().split(';')[0].trim();
}

function assertSupportedImportImageType(contentType: string) {
    const normalized = normalizeMimeType(contentType);
    if (!ALLOWED_IMPORT_IMAGE_TYPES.has(normalized)) {
        throw new Error(`Unsupported import image type: ${normalized}`);
    }
    return normalized;
}

function getExtensionFromMimeType(contentType: string) {
    switch (contentType) {
        case 'image/jpeg':
            return 'jpg';
        case 'image/png':
            return 'png';
        case 'image/webp':
            return 'webp';
        default:
            return 'bin';
    }
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
    const buffer = new ArrayBuffer(bytes.byteLength);
    new Uint8Array(buffer).set(bytes);
    return buffer;
}

async function resizeImageBytesIfNeeded(
    bytes: Uint8Array,
    contentType: string,
    fileNamePrefix: string,
) {
    const normalizedContentType = normalizeMimeType(contentType);
    if (!normalizedContentType.startsWith('image/')) {
        return {bytes, contentType};
    }

    const extension = getExtensionFromMimeType(normalizedContentType);
    const file = new File([toArrayBuffer(bytes)], `${fileNamePrefix}.${extension}`, {
        type: normalizedContentType,
        lastModified: Date.now(),
    });
    const resizedFile = await resizeImage(file);
    const resizedBytes = new Uint8Array(await resizedFile.arrayBuffer());

    return {
        bytes: resizedBytes,
        contentType: resizedFile.type || contentType,
    };
}

async function uploadBytes(
    client: ConvexClient,
    bytes: Uint8Array,
    contentType: string,
): Promise<Id<'images'>> {
    const uploadUrl = await client.mutation(api.images.generateUploadUrl, {});
    const requestBody = Uint8Array.from(bytes).buffer;
    const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {'Content-Type': contentType},
        body: requestBody,
    });
    if (!uploadResponse.ok) {
        throw new Error('Не удалось загрузить изображение в хранилище');
    }
    const payload = (await uploadResponse.json()) as {storageId?: Id<'_storage'>};
    if (!payload.storageId) {
        throw new Error('Не удалось получить storageId для изображения');
    }
    const image = await client.mutation(api.images.create, {
        storageId: payload.storageId,
    });
    return image.id;
}

async function uploadFromDataUrl(
    client: ConvexClient,
    dataUrl: string,
    cache: Map<string, Id<'images'>>,
) {
    const rawBytes = base64ToBytes(dataUrl);
    const contentType = assertSupportedImportImageType(getMimeTypeFromDataUrl(dataUrl));
    const {bytes, contentType: resizedContentType} = await resizeImageBytesIfNeeded(
        rawBytes,
        contentType,
        'import-image-data',
    );
    const id = await uploadBytes(client, bytes, resizedContentType);
    cache.set(dataUrl, id);
    return id;
}

async function uploadFromUrl(client: ConvexClient, url: string, cache: Map<string, Id<'images'>>) {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
    }

    const rawBytes = new Uint8Array(await response.arrayBuffer());
    const contentType =
        response.headers.get('content-type')?.split(';')[0] ?? 'application/octet-stream';
    const supportedContentType = assertSupportedImportImageType(contentType);

    const {bytes, contentType: resizedContentType} = await resizeImageBytesIfNeeded(
        rawBytes,
        supportedContentType,
        'import-image-url',
    );
    const id = await uploadBytes(client, bytes, resizedContentType);
    cache.set(url, id);
    return id;
}

export async function resolveImportImage(
    client: ConvexClient,
    source: string | undefined,
    cache: Map<string, Id<'images'>>,
) {
    if (!source) {
        return null;
    }

    const normalized = source.trim();
    if (!normalized) {
        return null;
    }

    const cached = cache.get(normalized);
    if (cached) {
        return cached;
    }

    try {
        if (normalized.startsWith('data:')) {
            return await uploadFromDataUrl(client, normalized, cache);
        }

        if (normalized.startsWith('http://') || normalized.startsWith('https://')) {
            return await uploadFromUrl(client, normalized, cache);
        }

        return null;
    } catch (error) {
        console.warn('Image import failed:', error);
        return null;
    }
}
