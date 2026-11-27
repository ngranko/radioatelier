import {ConvexError, v} from 'convex/values';
import {internal} from './_generated/api';
import type {Doc, Id} from './_generated/dataModel';
import {mutation, type MutationCtx, query, type QueryCtx} from './_generated/server';
import {resolveImageThumbnailUrl} from './helpers/imageStorage';
import {isImageInGallery} from './helpers/objectImages';
import {consumePhotoCaptureQuota, readPhotoCaptureQuota} from './helpers/photoCaptures/quota';
import {findUserOpenRouterKey} from './helpers/photoCaptures/userKeys';
import {
    assertObjectFieldLengths,
    assertValidMapPointCoordinates,
    mapPointCoreFields,
} from './sharedValidators';
import {getCurrentUserOrThrow} from './users';

const MAX_ATTEMPTS = 3;

export const create = mutation({
    args: {imageId: v.id('images'), ...mapPointCoreFields},
    handler: async (ctx, {imageId, ...location}) => {
        const user = await getCurrentUserOrThrow(ctx);
        assertValidMapPointCoordinates(location.latitude, location.longitude);
        assertObjectFieldLengths(location);
        await assertImageCapturable(ctx, imageId, user._id);
        // An account paying for its own analyses has nothing to ration.
        if (!(await findUserOpenRouterKey(ctx, user._id))) {
            await consumePhotoCaptureQuota(ctx, user._id);
        }

        const captureId = await ctx.db.insert('photoCaptures', {
            createdById: user._id,
            imageId,
            ...location,
            status: 'processing',
            attempts: 1,
        });
        await ctx.scheduler.runAfter(0, internal.photoCaptureAnalysis.analyze, {captureId});
        return captureId;
    },
});

export const retry = mutation({
    args: {id: v.id('photoCaptures')},
    handler: async (ctx, {id}) => {
        const capture = await loadOwnFailedCapture(ctx, id);
        if (capture.attempts >= MAX_ATTEMPTS) {
            throw new ConvexError('No attempts left');
        }
        await ctx.db.patch('photoCaptures', id, {
            status: 'processing',
            attempts: capture.attempts + 1,
            failureReason: undefined,
        });
        await ctx.scheduler.runAfter(0, internal.photoCaptureAnalysis.analyze, {captureId: id});
    },
});

export const dismiss = mutation({
    args: {id: v.id('photoCaptures')},
    handler: async (ctx, {id}) => {
        await loadOwnFailedCapture(ctx, id);
        await ctx.db.delete('photoCaptures', id);
    },
});

export const list = query({
    args: {},
    handler: async ctx => {
        const user = await getCurrentUserOrThrow(ctx);
        const captures = await ctx.db
            .query('photoCaptures')
            .withIndex('byCreatedById', q => q.eq('createdById', user._id))
            .order('desc')
            .collect();
        return await Promise.all(captures.map(capture => describeCapture(ctx, capture)));
    },
});

// What the create form needs to take over a capture the analysis gave up on.
export const getManualDraft = query({
    args: {id: v.id('photoCaptures')},
    handler: async (ctx, {id}) => {
        const user = await getCurrentUserOrThrow(ctx);
        const capture = await ctx.db.get('photoCaptures', id);
        if (capture?.createdById !== user._id || capture.status !== 'failed') {
            return null;
        }
        const url = await resolveImageThumbnailUrl(ctx, capture.imageId);
        return {
            image: url ? {id: capture.imageId, url, previewUrl: ''} : null,
            address: capture.address,
            city: capture.city,
            country: capture.country,
        };
    },
});

export const getQuota = query({
    args: {},
    handler: async ctx => {
        const user = await getCurrentUserOrThrow(ctx);
        const [userKey, quota] = await Promise.all([
            findUserOpenRouterKey(ctx, user._id),
            readPhotoCaptureQuota(ctx, user._id),
        ]);
        return {isUnlimited: userKey !== null, ...quota};
    },
});

// Same rule as galleries: only the uploader may hand an image over, and only
// one capture or gallery may hold it.
async function assertImageCapturable(ctx: MutationCtx, imageId: Id<'images'>, userId: Id<'users'>) {
    const image = await ctx.db.get('images', imageId);
    const capture = await ctx.db
        .query('photoCaptures')
        .withIndex('byImageId', q => q.eq('imageId', imageId))
        .first();
    if (image?.createdById !== userId || capture || (await isImageInGallery(ctx, imageId))) {
        throw new ConvexError('This photo cannot be analysed');
    }
}

async function loadOwnFailedCapture(ctx: MutationCtx, id: Id<'photoCaptures'>) {
    const user = await getCurrentUserOrThrow(ctx);
    const capture = await ctx.db.get('photoCaptures', id);
    if (capture?.createdById !== user._id || capture.status !== 'failed') {
        throw new ConvexError('Capture not found');
    }
    return capture;
}

async function describeCapture(ctx: QueryCtx, capture: Doc<'photoCaptures'>) {
    return {
        id: capture._id,
        status: capture.status,
        failureReason: capture.failureReason ?? null,
        canRetry: capture.attempts < MAX_ATTEMPTS,
        imageUrl: await resolveImageThumbnailUrl(ctx, capture.imageId),
        latitude: capture.latitude,
        longitude: capture.longitude,
        createdAt: capture._creationTime,
    };
}
