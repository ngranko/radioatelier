import {v} from 'convex/values';
import {internal} from './_generated/api';
import {internalAction, internalMutation, internalQuery} from './_generated/server';
import {loadAnalysisContext} from './helpers/photoCaptures/analysisContext';
import {analyzePhoto, classifyAnalysisFailure} from './helpers/photoCaptures/analyzePhoto';
import {createCapturedObject} from './helpers/photoCaptures/captureObject';
import {findUserOpenRouterKey} from './helpers/photoCaptures/userKeys';

export const analyze = internalAction({
    args: {captureId: v.id('photoCaptures')},
    handler: async (ctx, {captureId}) => {
        const input = await ctx.runQuery(internal.photoCaptureAnalysis.loadAnalysisInput, {
            captureId,
        });
        if (!input) {
            return;
        }
        const {userApiKey, ...photo} = input;
        try {
            const analysis = await analyzePhoto({
                ...photo,
                apiKey: userApiKey ?? requireArchiveKey(),
            });
            await ctx.runMutation(internal.photoCaptureAnalysis.complete, {captureId, ...analysis});
        } catch (error) {
            console.error('Photo capture analysis failed:', error);
            await ctx.runMutation(internal.photoCaptureAnalysis.fail, {
                captureId,
                reason: classifyAnalysisFailure(error),
            });
        }
    },
});

export const loadAnalysisInput = internalQuery({
    args: {captureId: v.id('photoCaptures')},
    handler: async (ctx, {captureId}) => {
        const capture = await ctx.db.get('photoCaptures', captureId);
        if (capture?.status !== 'processing') {
            return null;
        }
        const [image, userKey] = await Promise.all([
            ctx.db.get('images', capture.imageId),
            findUserOpenRouterKey(ctx, capture.createdById),
        ]);
        return {
            imageUrl: image ? await ctx.storage.getUrl(image.originalStorageId) : null,
            context: await loadAnalysisContext(ctx, capture),
            userApiKey: userKey?.apiKey ?? null,
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

function requireArchiveKey() {
    const key = process.env.OPENROUTER_API_KEY?.trim();
    if (!key) {
        throw new Error('Missing OPENROUTER_API_KEY environment variable');
    }
    return key;
}
