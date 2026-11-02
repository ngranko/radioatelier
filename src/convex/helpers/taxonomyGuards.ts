import {ConvexError} from 'convex/values';
import type {TaxonomyErrorCode} from '../../lib/interfaces/taxonomy';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';

export function taxonomyError(code: TaxonomyErrorCode) {
    return new ConvexError({code});
}

export function assertTaxonomyAvailable(taxonomy: {_id: string; isDeleting?: boolean} | null) {
    if (!taxonomy) {
        throw taxonomyError('notFound');
    }
    if (taxonomy.isDeleting) {
        throw taxonomyError('deletionInProgress');
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
        throw taxonomyError('migrationInProgress');
    }
}

export async function assertTagsAvailable(ctx: MutationCtx, tagIds: Id<'tags'>[]) {
    for (const id of new Set(tagIds)) {
        await loadAvailableTaxonomy(ctx, 'tags', id);
    }
}

export function assertNameAvailable(holder: {_id: string} | null, ownId: string) {
    if (holder && holder._id !== ownId) {
        throw taxonomyError('nameTaken');
    }
}

export function assertNotSelf(id: string, replacementId: string | null) {
    if (replacementId === id) {
        throw taxonomyError('selfReplacement');
    }
}
