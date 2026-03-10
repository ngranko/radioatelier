import {ConvexError, v} from 'convex/values';
import {mutation, query} from './_generated/server';
import {getCurrentUserOrThrow} from './users';

export const list = query({
    args: {},
    handler: async ctx => {
        const user = await getCurrentUserOrThrow(ctx);

        const privateTags = await ctx.db
            .query('privateTags')
            .withIndex('byCreatedById', q => q.eq('createdById', user._id))
            .collect();

        return privateTags.map(item => ({id: item._id, name: item.name}));
    },
});

export const create = mutation({
    args: {
        name: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrThrow(ctx);

        const normalizedName = args.name.trim().toLowerCase();
        if (!normalizedName) {
            throw new ConvexError('Tag name is required');
        }

        const existing = await ctx.db
            .query('privateTags')
            .withIndex('byNameCreatedById', q =>
                q.eq('name', normalizedName).eq('createdById', user._id),
            )
            .first();
        if (existing) {
            return existing._id;
        }

        const result = await ctx.db.insert('privateTags', {
            name: normalizedName,
            createdById: user._id,
        });
        return result;
    },
});
