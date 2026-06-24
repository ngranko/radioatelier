import {ConvexError, v} from 'convex/values';
import type {Id} from './_generated/dataModel';
import {mutation, query, type QueryCtx} from './_generated/server';
import {getCurrentUserOrThrow} from './users';

type SplitTagCandidate = {
    tagId: Id<'tags'>;
    name: string;
    parts: string[];
};

export const list = query({
    args: {},
    handler: async ctx => {
        const identity = await ctx.auth.getUserIdentity();
        if (identity === null) {
            throw new ConvexError('Unauthorized');
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
            throw new ConvexError('Unauthorized');
        }

        const normalizedName = args.name.trim().toLowerCase();
        if (!normalizedName) {
            throw new ConvexError('Tag name is required');
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

export const repairSeparatedTags = mutation({
    args: {
        dryRun: v.optional(v.boolean()),
        repairKey: v.optional(v.string()),
    },
    handler: async (ctx, {dryRun = true, repairKey}) => {
        await authorizeTagRepair(ctx, repairKey);

        const tags = await ctx.db.query('tags').collect();
        const candidates = tags
            .map(tag => ({
                tagId: tag._id,
                name: tag.name,
                parts: splitTagName(tag.name),
            }))
            .filter((item): item is SplitTagCandidate => item.parts.length > 1);

        const tagIdsByName = new Map(tags.map(tag => [tag.name, tag._id]));
        const tagNamesToCreate = new Set<string>();
        const replacements = new Map<Id<'tags'>, Id<'tags'>[]>();
        let splitTagsCreated = 0;

        for (const candidate of candidates) {
            const replacementIds: Id<'tags'>[] = [];
            for (const part of candidate.parts) {
                const existingId = tagIdsByName.get(part);
                if (existingId) {
                    replacementIds.push(existingId);
                    continue;
                }
                tagNamesToCreate.add(part);
                if (dryRun) {
                    continue;
                }
                const tagId = await ctx.db.insert('tags', {name: part});
                tagIdsByName.set(part, tagId);
                replacementIds.push(tagId);
                splitTagsCreated += 1;
            }
            replacements.set(candidate.tagId, replacementIds);
        }

        let objectsUpdated = 0;
        let markersUpdated = 0;
        const objects = await ctx.db.query('objects').collect();
        for (const object of objects) {
            const tagIds = replaceSeparatedTagIds(object.tagIds, replacements);
            if (haveSameTagIds(object.tagIds, tagIds)) {
                continue;
            }
            objectsUpdated += 1;
            const marker = await ctx.db
                .query('markers')
                .withIndex('byObjectId', q => q.eq('objectId', object._id))
                .unique();
            if (marker) {
                markersUpdated += 1;
            }
            if (dryRun) {
                continue;
            }
            await ctx.db.patch(object._id, {tagIds});
            if (marker) {
                await ctx.db.patch(marker._id, {tagIds});
            }
        }

        let tagsDeleted = 0;
        if (!dryRun) {
            for (const candidate of candidates) {
                await ctx.db.delete(candidate.tagId);
                tagsDeleted += 1;
            }
        }

        return {
            dryRun,
            combinedTags: candidates.length,
            splitTagsToCreate: tagNamesToCreate.size,
            splitTagsCreated,
            objectsUpdated,
            markersUpdated,
            tagsDeleted,
            replacements: candidates.map(candidate => ({
                tag: candidate.name,
                parts: candidate.parts,
            })),
        };
    },
});

async function authorizeTagRepair(ctx: QueryCtx, repairKey: string | undefined) {
    const expectedKey = process.env.TAG_REPAIR_KEY?.trim();
    if (expectedKey) {
        if (repairKey !== expectedKey) {
            throw new ConvexError('Unauthorized');
        }
        return;
    }

    const user = await getCurrentUserOrThrow(ctx);
    if (user.role !== 'admin') {
        throw new ConvexError('Unauthorized');
    }
}

function splitTagName(value: string) {
    return [
        ...new Set(
            value
                .split(/[;,]/)
                .map(item => item.trim().toLowerCase())
                .filter(Boolean),
        ),
    ];
}

function replaceSeparatedTagIds(tagIds: Id<'tags'>[], replacements: Map<Id<'tags'>, Id<'tags'>[]>) {
    const result: Id<'tags'>[] = [];
    for (const tagId of tagIds) {
        result.push(...(replacements.get(tagId) ?? [tagId]));
    }
    return [...new Set(result)];
}

function haveSameTagIds(left: Id<'tags'>[], right: Id<'tags'>[]) {
    return left.length === right.length && left.every((item, index) => item === right[index]);
}
