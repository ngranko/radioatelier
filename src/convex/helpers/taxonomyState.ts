import {ConvexError} from 'convex/values';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';

export function assertTaxonomyAvailable(taxonomy: {_id: string; isDeleting?: boolean} | null) {
    if (!taxonomy) {
        throw new ConvexError({code: 'notFound'});
    }
    if (taxonomy.isDeleting) {
        throw new ConvexError({code: 'deletionInProgress'});
    }
}

export async function loadAvailableTaxonomy<T extends 'categories' | 'tags'>(
    ctx: MutationCtx,
    table: T,
    id: Id<T>,
) {
    const taxonomy = await ctx.db.get(table, id);
    assertTaxonomyAvailable(taxonomy);
    return taxonomy!;
}

export async function assertNoIncomingMigration(
    ctx: MutationCtx,
    table: 'categories' | 'tags',
    id: Id<'categories'> | Id<'tags'>,
) {
    const incoming = await ctx.db
        .query(table)
        .withIndex('byDeletionReplacementId', q => q.eq('deletionReplacementId', id))
        .first();
    if (incoming) {
        throw new ConvexError({code: 'migrationInProgress'});
    }
}

export async function assertTagsAvailable(ctx: MutationCtx, tagIds: Id<'tags'>[]) {
    for (const id of new Set(tagIds)) {
        await loadAvailableTaxonomy(ctx, 'tags', id);
    }
}
