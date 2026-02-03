import type {Handle} from '@sveltejs/kit';
import {sequence} from '@sveltejs/kit/hooks';
import {withClerkHandler} from 'svelte-clerk/server';

const clerkHandle = withClerkHandler();

const forwardedHeadersHandle: Handle = async ({event, resolve}) => {
    event.url.host = event.request.headers.get('x-forwarded-host') ?? event.url.host;
    event.url.protocol = event.request.headers.get('x-forwarded-proto') ?? event.url.protocol;
    return resolve(event);
};

export const handle = sequence(forwardedHeadersHandle, clerkHandle);
