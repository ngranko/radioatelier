import {v} from 'convex/values';
import type {Doc} from './_generated/dataModel';
import {mutation, query, type QueryCtx} from './_generated/server';
import {countTaxonomyUsage} from './helpers/objectTaxonomy';
import {removeTaxonomy, renameTaxonomy} from './helpers/taxonomyEditor';
import {scheduleTaxonomyFanout} from './helpers/taxonomyFanout';
import {resolveTaxonomyRef, taxonomyTypeValidator} from './helpers/taxonomyRef';
import {getCurrentAdminOrThrow} from './users';

export const list = query({
    args: {},
    handler: async ctx => {
        await getCurrentAdminOrThrow(ctx);

        const [categories, tags, privateTags, usage] = await Promise.all([
            ctx.db.query('categories').collect(),
            ctx.db.query('tags').collect(),
            ctx.db.query('privateTags').collect(),
            countTaxonomyUsage(ctx),
        ]);
        const ownerEmails = await loadOwnerEmails(ctx, privateTags);

        return {
            categories: buildEntries(categories, usage.categories),
            tags: buildEntries(tags, usage.tags),
            privateTags: buildEntries(privateTags, usage.privateTags, item =>
                ownerEmails.get(item.createdById),
            ),
        };
    },
});

export const rename = mutation({
    args: {
        type: taxonomyTypeValidator,
        id: v.string(),
        name: v.string(),
    },
    handler: async (ctx, {type, id, name}) => {
        await getCurrentAdminOrThrow(ctx);

        const result = await renameTaxonomy(ctx, resolveTaxonomyRef(ctx, type, id), name);
        await scheduleTaxonomyFanout(ctx, result.objectIds, result.searchCategoryName);
    },
});

export const remove = mutation({
    args: {
        type: taxonomyTypeValidator,
        id: v.string(),
        replacementId: v.nullable(v.string()),
    },
    handler: async (ctx, {type, id, replacementId}) => {
        await getCurrentAdminOrThrow(ctx);

        const ref = resolveTaxonomyRef(ctx, type, id);
        const result = await removeTaxonomy(ctx, ref, replacementId);
        await scheduleTaxonomyFanout(ctx, result.objectIds, result.searchCategoryName);
    },
});

function buildEntries<K extends string, T extends {_id: K; name: string}>(
    items: T[],
    usage: Map<K, number>,
    readOwnerEmail?: (item: T) => string | undefined,
) {
    return items
        .map(item => ({
            id: item._id,
            name: item.name,
            usageCount: usage.get(item._id) ?? 0,
            ownerEmail: readOwnerEmail?.(item) ?? null,
        }))
        .sort(
            (left, right) =>
                (left.ownerEmail ?? '').localeCompare(right.ownerEmail ?? '') ||
                left.name.localeCompare(right.name),
        );
}

async function loadOwnerEmails(ctx: QueryCtx, privateTags: Doc<'privateTags'>[]) {
    const ownerIds = [...new Set(privateTags.map(item => item.createdById))];
    const owners = await Promise.all(ownerIds.map(ownerId => ctx.db.get('users', ownerId)));

    return new Map(
        owners
            .filter((owner): owner is Doc<'users'> => owner !== null)
            .map(owner => [owner._id, owner.email]),
    );
}
