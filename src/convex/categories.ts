import {ConvexError, v} from 'convex/values';
import {mutation, query} from './_generated/server';

export const list = query({
    args: {},
    handler: async ctx => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new ConvexError('Unauthorized');
        }

        const categories = await ctx.db.query('categories').collect();

        return categories.map(item => ({id: item._id, name: item.name}));
    },
});

export const create = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new ConvexError('Unauthorized');
        }

        const normalizedName = args.name.trim().toLowerCase();
        if (!normalizedName) {
            throw new ConvexError('Category name is required');
        }

        const existing = await ctx.db
            .query('categories')
            .withIndex('byName', q => q.eq('name', normalizedName))
            .first();
        if (existing) {
            return existing._id;
        }

        const result = await ctx.db.insert('categories', {name: normalizedName});
        return result;
    },
});
