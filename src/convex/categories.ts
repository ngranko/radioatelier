import {ConvexError, v} from 'convex/values';
import {
    MARKER_COLORS,
    MARKER_ICON_KEYS,
    randomMarkerColor,
    randomMarkerIconKey,
} from '../lib/services/map/markerStyling.data';
import {mutation, query} from './_generated/server';
import {getCurrentUserOrThrow} from './users';

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

        const result = await ctx.db.insert('categories', {
            name: normalizedName,
            markerColor: randomMarkerColor(),
            markerIcon: randomMarkerIconKey(),
        });
        return result;
    },
});
