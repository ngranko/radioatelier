import type {HandleFetch} from '@sveltejs/kit';

export const handle = async ({event, resolve}) => {
    return resolve(event);
};

export const handleFetch: HandleFetch = async ({event, request, fetch}) => {
    const forwardedHost = event.request.headers.get('x-forwarded-host');
    const forwardedProto = event.request.headers.get('x-forwarded-proto');

    if (!forwardedHost && !forwardedProto) {
        return fetch(request);
    }

    const url = new URL(request.url);
    if (url.origin !== event.url.origin) {
        return fetch(request);
    }

    if (forwardedHost) {
        url.host = forwardedHost;
    }
    if (forwardedProto) {
        url.protocol = forwardedProto.endsWith(':') ? forwardedProto : `${forwardedProto}:`;
    }

    return fetch(new Request(url, request));
};
