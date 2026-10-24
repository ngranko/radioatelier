import type {TaxonomyEntry} from '../lib/interfaces/taxonomy';
import {query, type QueryCtx} from './_generated/server';
import {countPrivateTagUsage, countSharedTaxonomyUsage} from './helpers/objectTaxonomy';
import {getCurrentUserOrThrow} from './users';

// Private tags belong to their owner, so every user manages their own; the
// shared vocabulary is the archive's, so only admins may reshape it.
export const list = query({
    args: {},
    handler: async ctx => {
        const user = await getCurrentUserOrThrow(ctx);
        const [privateTags, privateTagUsage] = await Promise.all([
            ctx.db
                .query('privateTags')
                .withIndex('byCreatedById', q => q.eq('createdById', user._id))
                .collect(),
            countPrivateTagUsage(ctx, user._id),
        ]);
        const shared =
            user.role === 'admin'
                ? await loadSharedTaxonomies(ctx)
                : {categories: [] as TaxonomyEntry[], tags: [] as TaxonomyEntry[]};

        return {
            ...shared,
            privateTags: buildEntries(privateTags, privateTagUsage),
        };
    },
});

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
): TaxonomyEntry[] {
    return items
        .map(item => ({
            id: item._id,
            name: item.name,
            usageCount: usage.get(item._id) ?? 0,
        }))
        .sort((left, right) => left.name.localeCompare(right.name));
}
