import {ConvexError, v} from 'convex/values';
import {MARKER_COLORS, MARKER_ICON_KEYS} from '../lib/services/map/markerStyling.data';
import {mutation, query} from './_generated/server';
import {ensureCategory} from './helpers/importHelpers';
import {removeCategory, renameCategory} from './helpers/taxonomyEditor';
import {normalizeCategoryName} from './helpers/taxonomyNames';
import {getCurrentAdminOrThrow, getCurrentUserOrThrow} from './users';

export const list = query({
    args: {},
    handler: async ctx => {
        const user = await getCurrentUserOrThrow(ctx);

        const categories = await ctx.db.query('categories').collect();
        const userCategories = await ctx.db
            .query('userCategoryMarkerStyles')
            .withIndex('byUserId', q => q.eq('userId', user._id))
            .collect();

        const byKey = new Map(userCategories.map(item => [item.categoryId, item]));
        return categories.map(item => ({
            id: item._id,
            name: item.name,
            markerColor: byKey.get(item._id)?.markerColor ?? item.markerColor,
            markerIcon: byKey.get(item._id)?.markerIcon ?? item.markerIcon,
            isHidden: byKey.get(item._id)?.isHidden ?? false,
        }));
    },
});

export const updateStyles = mutation({
    args: {
        styles: v.array(
            v.object({
                categoryId: v.id('categories'),
                markerColor: v.string(),
                markerIcon: v.string(),
                isHidden: v.boolean(),
            }),
        ),
    },
    handler: async (ctx, args) => {
        const user = await getCurrentUserOrThrow(ctx);

        for (const style of args.styles) {
            if (
                !MARKER_COLORS.includes(style.markerColor as (typeof MARKER_COLORS)[number]) ||
                !MARKER_ICON_KEYS.includes(style.markerIcon as (typeof MARKER_ICON_KEYS)[number])
            ) {
                throw new ConvexError('Invalid category style');
            }

            const existing = await ctx.db
                .query('userCategoryMarkerStyles')
                .withIndex('byUserIdCategoryId', q =>
                    q.eq('userId', user._id).eq('categoryId', style.categoryId),
                )
                .first();

            if (existing) {
                await ctx.db.patch(existing._id, {
                    markerColor: style.markerColor,
                    markerIcon: style.markerIcon,
                    isHidden: style.isHidden,
                });
            } else {
                await ctx.db.insert('userCategoryMarkerStyles', {
                    userId: user._id,
                    categoryId: style.categoryId,
                    markerColor: style.markerColor,
                    markerIcon: style.markerIcon,
                    isHidden: style.isHidden,
                });
            }
        }
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

        return await ensureCategory(ctx, normalizeCategoryName(args.name));
    },
});

export const rename = mutation({
    args: {
        id: v.id('categories'),
        name: v.string(),
    },
    handler: async (ctx, {id, name}) => {
        await getCurrentAdminOrThrow(ctx);
        await renameCategory(ctx, id, name);
    },
});

export const remove = mutation({
    args: {
        id: v.id('categories'),
        replacementId: v.nullable(v.id('categories')),
    },
    handler: async (ctx, {id, replacementId}) => {
        await getCurrentAdminOrThrow(ctx);
        await removeCategory(ctx, id, replacementId);
    },
});
