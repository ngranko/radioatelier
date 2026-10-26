import {ConvexError, v} from 'convex/values';
import {mutation, query} from './_generated/server';
import {removeTag, renameTag} from './helpers/taxonomyEditor';
import {findTagByName, normalizeTagName} from './helpers/taxonomyNames';
import {assertTaxonomyAvailable} from './helpers/taxonomyState';
import {getCurrentAdminOrThrow} from './users';

export const list = query({
    args: {},
    handler: async ctx => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new ConvexError('Unauthorized');
        }

        const tags = await ctx.db.query('tags').collect();

        return tags.map(item => ({
            id: item._id,
            name: item.name,
            isDeleting: item.isDeleting ?? false,
        }));
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

        const normalizedName = normalizeTagName(args.name);

        const existing = await findTagByName(ctx, normalizedName);
        if (existing) {
            assertTaxonomyAvailable(existing);
            return existing._id;
        }

        const result = await ctx.db.insert('tags', {name: normalizedName});
        return result;
    },
});

export const rename = mutation({
    args: {
        id: v.id('tags'),
        name: v.string(),
    },
    handler: async (ctx, {id, name}) => {
        await getCurrentAdminOrThrow(ctx);
        await renameTag(ctx, id, name);
    },
});

export const remove = mutation({
    args: {
        id: v.id('tags'),
        replacementId: v.nullable(v.id('tags')),
    },
    handler: async (ctx, {id, replacementId}) => {
        await getCurrentAdminOrThrow(ctx);
        await removeTag(ctx, id, replacementId);
    },
});
