import {RateLimiter} from '@convex-dev/rate-limiter';
import {
    PHOTO_CAPTURE_QUOTA_PERIOD_MS,
    PHOTO_CAPTURES_PER_HOUR,
    type PhotoCaptureQuota,
} from '../../../lib/utils/photoCaptureQuota';
import {components} from '../../_generated/api';
import type {Id} from '../../_generated/dataModel';
import type {MutationCtx, QueryCtx} from '../../_generated/server';

// Every analysis is a paid model call, so accounts without their own key share
// the archive's budget through a small per-user bucket.
const rateLimiter = new RateLimiter(components.rateLimiter, {
    photoCaptures: {
        kind: 'token bucket',
        rate: PHOTO_CAPTURES_PER_HOUR,
        period: PHOTO_CAPTURE_QUOTA_PERIOD_MS,
        capacity: PHOTO_CAPTURES_PER_HOUR,
    },
});

export async function consumePhotoCaptureQuota(ctx: MutationCtx, userId: Id<'users'>) {
    await rateLimiter.limit(ctx, 'photoCaptures', {key: userId, throws: true});
}

export async function readPhotoCaptureQuota(
    ctx: QueryCtx,
    userId: Id<'users'>,
): Promise<Omit<PhotoCaptureQuota, 'isUnlimited'>> {
    const {value, ts} = await rateLimiter.getValue(ctx, 'photoCaptures', {key: userId});
    return {tokens: value, measuredAt: ts};
}
