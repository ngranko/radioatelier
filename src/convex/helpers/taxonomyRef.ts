import {ConvexError, v} from 'convex/values';
import type {Doc, Id} from '../_generated/dataModel';
import type {MutationCtx, QueryCtx} from '../_generated/server';

type ReaderCtx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

export const taxonomyTypeValidator = v.union(
    v.literal('category'),
    v.literal('tag'),
    v.literal('privateTag'),
);

export type TaxonomyType = 'category' | 'tag' | 'privateTag';

export type TaxonomyRef =
    | {type: 'category'; id: Id<'categories'>}
    | {type: 'tag'; id: Id<'tags'>}
    | {type: 'privateTag'; id: Id<'privateTags'>};

export type TaxonomyDoc = Doc<'categories'> | Doc<'tags'> | Doc<'privateTags'>;

const tableByType = {
    category: 'categories',
    tag: 'tags',
    privateTag: 'privateTags',
} as const;

// Ids arrive as plain strings so the client does not have to model the
// three-way union; normalizing here is what proves the id belongs to the
// table its type claims.
export function resolveTaxonomyRef(ctx: ReaderCtx, type: TaxonomyType, id: string): TaxonomyRef {
    const normalizedId = ctx.db.normalizeId(tableByType[type], id);
    if (!normalizedId) {
        throw new ConvexError('Taxonomy not found');
    }
    return {type, id: normalizedId} as TaxonomyRef;
}

export async function loadTaxonomyOrThrow(ctx: ReaderCtx, ref: TaxonomyRef): Promise<TaxonomyDoc> {
    const taxonomy = await ctx.db.get(tableByType[ref.type], ref.id);
    if (!taxonomy) {
        throw new ConvexError('Taxonomy not found');
    }
    return taxonomy as TaxonomyDoc;
}

export function normalizeTaxonomyName(name: string) {
    const normalizedName = name.trim().toLowerCase();
    if (!normalizedName) {
        throw new ConvexError('Taxonomy name is required');
    }
    return normalizedName;
}

// Private tags are per-user, so the same name may exist once per owner.
export async function findTaxonomyByName(
    ctx: ReaderCtx,
    ref: TaxonomyRef,
    name: string,
): Promise<TaxonomyDoc | null> {
    if (ref.type === 'category') {
        return await ctx.db
            .query('categories')
            .withIndex('byName', q => q.eq('name', name))
            .first();
    }
    if (ref.type === 'tag') {
        return await ctx.db
            .query('tags')
            .withIndex('byName', q => q.eq('name', name))
            .first();
    }

    const privateTag = await loadTaxonomyOrThrow(ctx, ref);
    return await ctx.db
        .query('privateTags')
        .withIndex('byNameCreatedById', q =>
            q.eq('name', name).eq('createdById', (privateTag as Doc<'privateTags'>).createdById),
        )
        .first();
}
