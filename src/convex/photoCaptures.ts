import {ConvexError, v} from 'convex/values';
import {internal} from './_generated/api';
import type {Doc, Id} from './_generated/dataModel';
import {
    internalMutation,
    internalQuery,
    mutation,
    type MutationCtx,
    query,
    type QueryCtx,
} from './_generated/server';
import {isImageInGallery} from './helpers/objectImages';
import {loadAnalysisContext} from './helpers/photoCaptures/analysisContext';
import {createCapturedObject} from './helpers/photoCaptures/captureObject';
import {consumePhotoCaptureQuota, readPhotoCaptureQuota} from './helpers/photoCaptures/quota';
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
        await consumePhotoCaptureQuota(ctx, user._id);

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

export const getQuota = query({
    args: {},
    handler: async ctx => {
        const user = await getCurrentUserOrThrow(ctx);
        return {isUnlimited: false, ...(await readPhotoCaptureQuota(ctx, user._id))};
    },
});

export const loadAnalysisInput = internalQuery({
    args: {captureId: v.id('photoCaptures')},
    handler: async (ctx, {captureId}) => {
        const capture = await ctx.db.get('photoCaptures', captureId);
        if (capture?.status !== 'processing') {
            return null;
        }
        const image = await ctx.db.get('images', capture.imageId);
        return {
            imageUrl: image ? await ctx.storage.getUrl(image.originalStorageId) : null,
            context: await loadAnalysisContext(ctx, capture),
        };
    },
});

export const complete = internalMutation({
    args: {
        captureId: v.id('photoCaptures'),
        name: v.string(),
        categoryId: v.id('categories'),
        tagIds: v.array(v.id('tags')),
    },
    handler: async (ctx, {captureId, ...analysis}) => {
        const capture = await ctx.db.get('photoCaptures', captureId);
        if (capture?.status !== 'processing') {
            return;
        }
        await createCapturedObject(ctx, capture, analysis);
        await ctx.db.delete('photoCaptures', captureId);
    },
});

export const fail = internalMutation({
    args: {captureId: v.id('photoCaptures'), reason: v.string()},
    handler: async (ctx, {captureId, reason}) => {
        const capture = await ctx.db.get('photoCaptures', captureId);
        if (capture?.status === 'processing') {
            await ctx.db.patch('photoCaptures', captureId, {
                status: 'failed',
                failureReason: reason,
            });
        }
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
    const image = await ctx.db.get('images', capture.imageId);
    const storageId = image?.previewStorageId ?? image?.originalStorageId;
    return {
        id: capture._id,
        status: capture.status,
        failureReason: capture.failureReason ?? null,
        canRetry: capture.attempts < MAX_ATTEMPTS,
        imageUrl: storageId ? await ctx.storage.getUrl(storageId) : null,
        createdAt: capture._creationTime,
    };
}
