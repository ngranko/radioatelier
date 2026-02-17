import {PUBLIC_CONVEX_URL} from '$env/static/public';
import {ConvexHttpClient} from 'convex/browser';
import type {RequestEvent} from '@sveltejs/kit';

type Locals = RequestEvent['locals'];

const tokenPromiseByLocals = new WeakMap<Locals, Promise<string | null>>();

async function getConvexToken(locals: Locals) {
    let tokenPromise = tokenPromiseByLocals.get(locals);
    if (!tokenPromise) {
        tokenPromise = locals.auth().getToken({template: 'convex'});
        tokenPromiseByLocals.set(locals, tokenPromise);
    }

    return tokenPromise;
}

export async function getConvexClient(locals: Locals) {
    const client = new ConvexHttpClient(PUBLIC_CONVEX_URL);
    const token = await getConvexToken(locals);
    if (token) {
        client.setAuth(token);
    }

    return {client, token};
}
