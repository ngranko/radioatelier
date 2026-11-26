import {ConvexError, v} from 'convex/values';
import {internal} from './_generated/api';
import {action, internalMutation, mutation} from './_generated/server';
import {findUserOpenRouterKey} from './helpers/photoCaptures/userKeys';
import {getCurrentUserOrThrow} from './users';

const KEY_INFO_URL = 'https://openrouter.ai/api/v1/key';
const MAX_KEY_LENGTH = 512;

export const connect = action({
    args: {apiKey: v.string()},
    handler: async (ctx, {apiKey}) => {
        const key = apiKey.trim();
        if (!key || key.length > MAX_KEY_LENGTH || !(await isKeyAccepted(key))) {
            throw new ConvexError('Key rejected');
        }
        await ctx.runMutation(internal.openRouterKeys.store, {apiKey: key});
    },
});

export const store = internalMutation({
    args: {apiKey: v.string()},
    handler: async (ctx, {apiKey}) => {
        const user = await getCurrentUserOrThrow(ctx);
        const existing = await findUserOpenRouterKey(ctx, user._id);
        if (existing) {
            await ctx.db.patch('userOpenRouterKeys', existing._id, {apiKey});
        } else {
            await ctx.db.insert('userOpenRouterKeys', {userId: user._id, apiKey});
        }
    },
});

export const disconnect = mutation({
    args: {},
    handler: async ctx => {
        const user = await getCurrentUserOrThrow(ctx);
        const existing = await findUserOpenRouterKey(ctx, user._id);
        if (existing) {
            await ctx.db.delete('userOpenRouterKeys', existing._id);
        }
    },
});

async function isKeyAccepted(apiKey: string) {
    const response = await fetch(KEY_INFO_URL, {
        headers: {Authorization: `Bearer ${apiKey}`},
        signal: AbortSignal.timeout(10_000),
    });
    return response.ok;
}
