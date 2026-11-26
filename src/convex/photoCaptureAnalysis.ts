import {v} from 'convex/values';
import {internal} from './_generated/api';
import {internalAction} from './_generated/server';
import {analyzePhoto, classifyAnalysisFailure} from './helpers/photoCaptures/analyzePhoto';

export const analyze = internalAction({
    args: {captureId: v.id('photoCaptures')},
    handler: async (ctx, {captureId}) => {
        const input = await ctx.runQuery(internal.photoCaptures.loadAnalysisInput, {captureId});
        if (!input) {
            return;
        }
        const {userApiKey, ...photo} = input;
        try {
            const analysis = await analyzePhoto({
                ...photo,
                apiKey: userApiKey ?? requireArchiveKey(),
            });
            await ctx.runMutation(internal.photoCaptures.complete, {captureId, ...analysis});
        } catch (error) {
            console.error('Photo capture analysis failed:', error);
            await ctx.runMutation(internal.photoCaptures.fail, {
                captureId,
                reason: classifyAnalysisFailure(error),
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
