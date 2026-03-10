import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';

export async function ensureCategory(ctx: MutationCtx, normalizedName: string) {
    const existing = await ctx.db
        .query('categories')
        .withIndex('byName', q => q.eq('name', normalizedName))
        .first();
    if (existing) {
        return existing._id;
    }
    return await ctx.db.insert('categories', {name: normalizedName});
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
