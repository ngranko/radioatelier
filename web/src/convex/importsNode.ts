'use node';

import {ConvexError, v} from 'convex/values';
import {Buffer} from 'node:buffer';
import {action} from './_generated/server';

export const fetchImageBytesFromUrl = action({
    args: {url: v.string()},
    returns: v.object({
        bytesBase64: v.string(),
        contentType: v.string(),
    }),
    handler: async (_ctx, {url}) => {
        const response = await fetch(url);
        if (!response.ok) {
            throw new ConvexError(`Не удалось загрузить изображение (${response.status})`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const bytesBase64 = Buffer.from(arrayBuffer).toString('base64');
        const contentType =
            response.headers.get('content-type')?.split(';')[0] ?? 'application/octet-stream';
        return {bytesBase64, contentType};
    },
});
