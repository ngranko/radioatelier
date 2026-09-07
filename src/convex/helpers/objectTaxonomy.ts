import type {Doc, Id} from '../_generated/dataModel';
import type {MutationCtx, QueryCtx} from '../_generated/server';

type ReaderCtx = Pick<QueryCtx, 'db'> | Pick<MutationCtx, 'db'>;

export type TaxonomyUsage = {
    categories: Map<Id<'categories'>, number>;
    tags: Map<Id<'tags'>, number>;
    privateTags: Map<Id<'privateTags'>, number>;
};

// Markers mirror the category and tags of their Object, so one scan of the
// lighter table answers the usage question for every user at once.
export async function countTaxonomyUsage(ctx: ReaderCtx): Promise<TaxonomyUsage> {
    const [markers, privateTagRows] = await Promise.all([
        ctx.db.query('markers').collect(),
        ctx.db.query('objectPrivateTags').collect(),
    ]);

    const usage: TaxonomyUsage = {
        categories: new Map(),
        tags: new Map(),
        privateTags: new Map(),
    };
    for (const marker of markers) {
        countOne(usage.categories, marker.categoryId);
        for (const tagId of new Set(marker.tagIds)) {
            countOne(usage.tags, tagId);
        }
    }
    for (const row of privateTagRows) {
        for (const tagId of new Set(row.privateTagIds)) {
            countOne(usage.privateTags, tagId);
        }
    }
    return usage;
}

export async function listMarkersUsingCategory(ctx: ReaderCtx, categoryId: Id<'categories'>) {
    return await ctx.db
        .query('markers')
        .filter(q => q.eq(q.field('categoryId'), categoryId))
        .collect();
}

export async function listMarkersUsingTag(ctx: ReaderCtx, tagId: Id<'tags'>) {
    const markers = await ctx.db.query('markers').collect();
    return markers.filter(marker => marker.tagIds.includes(tagId));
}

export async function moveObjectsToCategory(
    ctx: MutationCtx,
    categoryId: Id<'categories'>,
    replacementId: Id<'categories'>,
) {
    const markers = await listMarkersUsingCategory(ctx, categoryId);
    for (const marker of markers) {
        await ctx.db.patch('markers', marker._id, {categoryId: replacementId});
        await ctx.db.patch('objects', marker.objectId, {categoryId: replacementId});
    }
    return collectObjectIds(markers);
}

export async function replaceTagOnObjects(
    ctx: MutationCtx,
    tagId: Id<'tags'>,
    replacementId: Id<'tags'> | null,
) {
    const markers = await listMarkersUsingTag(ctx, tagId);
    for (const marker of markers) {
        const tagIds = rebuildIdList(marker.tagIds, tagId, replacementId);
        await ctx.db.patch('markers', marker._id, {tagIds});
        await ctx.db.patch('objects', marker.objectId, {tagIds});
    }
    return collectObjectIds(markers);
}

export async function replacePrivateTagOnObjects(
    ctx: MutationCtx,
    privateTagId: Id<'privateTags'>,
    replacementId: Id<'privateTags'> | null,
) {
    const rows = await ctx.db.query('objectPrivateTags').collect();
    const affected = rows.filter(row => row.privateTagIds.includes(privateTagId));
    for (const row of affected) {
        await ctx.db.patch('objectPrivateTags', row._id, {
            privateTagIds: rebuildIdList(row.privateTagIds, privateTagId, replacementId),
        });
    }
    return affected.map(row => row.objectId);
}

export function rebuildIdList<T extends string>(ids: T[], removedId: T, replacementId: T | null) {
    const kept = ids.filter(id => id !== removedId);
    if (replacementId !== null && !kept.includes(replacementId)) {
        kept.push(replacementId);
    }
    return kept;
}

function collectObjectIds(markers: Doc<'markers'>[]) {
    return markers.map(marker => marker.objectId);
}

function countOne<K>(counter: Map<K, number>, key: K) {
    counter.set(key, (counter.get(key) ?? 0) + 1);
}
