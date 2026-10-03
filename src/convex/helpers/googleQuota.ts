import {HOUR, RateLimiter} from '@convex-dev/rate-limiter';
import {ConvexError} from 'convex/values';
import {components} from '../_generated/api';
import type {ActionCtx} from '../_generated/server';

// Google bills every Maps request, and these actions are callable straight from
// the browser, so each account gets its own budget shared across all of them.
const rateLimiter = new RateLimiter(components.rateLimiter, {
    googleMaps: {kind: 'token bucket', rate: 200, period: HOUR, capacity: 50},
});

export async function consumeGoogleQuota(ctx: ActionCtx) {
    await rateLimiter.limit(ctx, 'googleMaps', {key: await requireUserKey(ctx), throws: true});
}

export async function tryConsumeGoogleQuota(ctx: ActionCtx) {
    const {ok} = await rateLimiter.limit(ctx, 'googleMaps', {key: await requireUserKey(ctx)});
    return ok;
}

async function requireUserKey(ctx: ActionCtx) {
    const identity = await ctx.auth.getUserIdentity();
    if (identity === null) {
        throw new ConvexError('Unauthorized');
    }
    return identity.subject;
}
