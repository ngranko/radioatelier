import {v} from 'convex/values';
import {mutation, query} from './_generated/server';
import {removePrivateTag, renamePrivateTag} from './helpers/taxonomyEditor';
import {findPrivateTagByName, normalizeTagName} from './helpers/taxonomyNames';
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

        const normalizedName = normalizeTagName(args.name);

        const existing = await findPrivateTagByName(ctx, user._id, normalizedName);
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

export const rename = mutation({
    args: {
        id: v.id('privateTags'),
        name: v.string(),
    },
    handler: async (ctx, {id, name}) => {
        const user = await getCurrentUserOrThrow(ctx);
        await renamePrivateTag(ctx, user._id, id, name);
    },
});

export const remove = mutation({
    args: {
        id: v.id('privateTags'),
        replacementId: v.nullable(v.id('privateTags')),
    },
    handler: async (ctx, {id, replacementId}) => {
        const user = await getCurrentUserOrThrow(ctx);
        await removePrivateTag(ctx, user._id, id, replacementId);
    },
});
