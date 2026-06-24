import {randomMarkerColor, randomMarkerIconKey} from '../../lib/services/map/markerStyling.data';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';

export function capitalizeCategoryName(value: string) {
    return value
        .trim()
        .toLowerCase()
        .replace(/\p{L}+/gu, word => word.charAt(0).toUpperCase() + word.slice(1));
}

async function findCategoryByName(ctx: MutationCtx, name: string) {
    const exactMatch = await ctx.db
        .query('categories')
        .withIndex('byName', q => q.eq('name', name))
        .first();
    if (exactMatch) {
        return exactMatch;
    }

    const normalizedName = name.toLowerCase();
    const categories = await ctx.db.query('categories').collect();
    return categories.find(category => category.name.toLowerCase() === normalizedName) ?? null;
}

export async function ensureCategory(ctx: MutationCtx, rawName: string) {
    const name = capitalizeCategoryName(rawName);
    const existing = await findCategoryByName(ctx, name);
    if (existing) {
        return existing._id;
    }
    return await ctx.db.insert('categories', {
        name,
        markerColor: randomMarkerColor(),
        markerIcon: randomMarkerIconKey(),
    });
}

export async function ensureTags(ctx: MutationCtx, tags: string[]) {
    const uniqueNames = [...new Set(tags)];
    const tagIds: Id<'tags'>[] = [];
    for (const name of uniqueNames) {
        const existing = await ctx.db
            .query('tags')
            .withIndex('byName', q => q.eq('name', name))
            .first();
        if (existing) {
            tagIds.push(existing._id);
            continue;
        }
        tagIds.push(await ctx.db.insert('tags', {name}));
    }
    return tagIds;
}

export async function ensurePrivateTags(ctx: MutationCtx, tags: string[], userId: Id<'users'>) {
    const uniqueNames = [...new Set(tags)];
    const tagIds: Id<'privateTags'>[] = [];
    for (const name of uniqueNames) {
        const existing = await ctx.db
            .query('privateTags')
            .withIndex('byNameCreatedById', q => q.eq('name', name).eq('createdById', userId))
            .first();
        if (existing) {
            tagIds.push(existing._id);
            continue;
        }
        tagIds.push(
            await ctx.db.insert('privateTags', {
                name,
                createdById: userId,
            }),
        );
    }
    return tagIds;
}
