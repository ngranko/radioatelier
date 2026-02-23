import {v} from 'convex/values';
import {mutation, query} from './_generated/server';

export const list = query({
    args: {},
    handler: async ctx => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new Error('Unauthorized');
        }

        const tags = await ctx.db.query('tags').collect();

        return tags.map(item => ({id: item._id, name: item.name}));
    },
});

export const create = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new Error('Unauthorized');
        }

        const normalizedName = args.name.trim();
        if (!normalizedName) {
            throw new Error('Tag name is required');
        }

        const existing = await ctx.db
            .query('tags')
            .withIndex('byName', q => q.eq('name', normalizedName))
            .first();
        if (existing) {
            return existing._id;
        }

        const result = await ctx.db.insert('tags', {name: normalizedName});
        return result;
    },
});
