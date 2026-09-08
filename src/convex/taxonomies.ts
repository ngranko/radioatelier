import {ConvexError, v} from 'convex/values';
import {mutation, query, type MutationCtx, type QueryCtx} from './_generated/server';
import {countPrivateTagUsage, countSharedTaxonomyUsage} from './helpers/objectTaxonomy';
import {removeTaxonomy, renameTaxonomy} from './helpers/taxonomyEditor';
import {scheduleTaxonomyFanout} from './helpers/taxonomyFanout';
import {resolveTaxonomyRef, taxonomyTypeValidator, type TaxonomyRef} from './helpers/taxonomyRef';
import {getCurrentAdminOrThrow, getCurrentUserOrThrow} from './users';

type TaxonomyListEntry = {
    id: string;
    name: string;
    usageCount: number;
};

// Private tags belong to their owner, so every user manages their own; the
// shared vocabulary is the archive's, so only admins may reshape it.
export const list = query({
    args: {},
    handler: async ctx => {
        const user = await getCurrentUserOrThrow(ctx);
        const isAdmin = user.role === 'admin';

        const [privateTags, privateTagUsage] = await Promise.all([
            ctx.db
                .query('privateTags')
                .withIndex('byCreatedById', q => q.eq('createdById', user._id))
                .collect(),
            countPrivateTagUsage(ctx, user._id),
        ]);
        const shared = isAdmin
            ? await loadSharedTaxonomies(ctx)
            : {categories: [] as TaxonomyListEntry[], tags: [] as TaxonomyListEntry[]};

        return {
            isAdmin,
            ...shared,
            privateTags: buildEntries(privateTags, privateTagUsage),
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
        const ref = resolveTaxonomyRef(ctx, type, id);
        await authorizeTaxonomyEdit(ctx, ref);

        const result = await renameTaxonomy(ctx, ref, name);
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
        const ref = resolveTaxonomyRef(ctx, type, id);
        await authorizeTaxonomyEdit(ctx, ref);

        const result = await removeTaxonomy(ctx, ref, replacementId);
        await scheduleTaxonomyFanout(ctx, result.objectIds, result.searchCategoryName);
    },
});

async function authorizeTaxonomyEdit(ctx: MutationCtx, ref: TaxonomyRef) {
    if (ref.type !== 'privateTag') {
        await getCurrentAdminOrThrow(ctx);
        return;
    }

    const user = await getCurrentUserOrThrow(ctx);
    const privateTag = await ctx.db.get('privateTags', ref.id);
    if (!privateTag || privateTag.createdById !== user._id) {
        throw new ConvexError('Forbidden');
    }
}

async function loadSharedTaxonomies(ctx: QueryCtx) {
    const [categories, tags, usage] = await Promise.all([
        ctx.db.query('categories').collect(),
        ctx.db.query('tags').collect(),
        countSharedTaxonomyUsage(ctx),
    ]);

    return {
        categories: buildEntries(categories, usage.categories),
        tags: buildEntries(tags, usage.tags),
    };
}

function buildEntries<K extends string>(
    items: {_id: K; name: string}[],
    usage: Map<K, number>,
): TaxonomyListEntry[] {
    return items
        .map(item => ({
            id: item._id,
            name: item.name,
            usageCount: usage.get(item._id) ?? 0,
        }))
        .sort((left, right) => left.name.localeCompare(right.name));
}
