export const handle = async ({event, resolve}) => {
    event.url.host = event.request.headers.get('x-forwarded-host') ?? event.url.host;
    event.url.protocol = event.request.headers.get('x-forwarded-proto') ?? event.url.protocol;
    return resolve(event);
};
