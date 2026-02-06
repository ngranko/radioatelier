export const handle = async ({event, resolve}) => {
    const forwardedHost = event.request.headers.get('x-forwarded-host');
    const forwardedProto = event.request.headers.get('x-forwarded-proto');

    if (forwardedHost) {
        event.url.host = forwardedHost;
    }
    if (forwardedProto) {
        event.url.protocol = `${forwardedProto}:`;
    }

    return resolve(event);
};
