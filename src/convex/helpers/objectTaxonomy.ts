import type {Doc, Id} from '../_generated/dataModel';
import type {MutationCtx, QueryCtx} from '../_generated/server';

type ReaderCtx = Pick<QueryCtx, 'db'>;

export type SharedTaxonomyUsage = {
    categories: Map<Id<'categories'>, number>;
    tags: Map<Id<'tags'>, number>;
};

// Markers mirror the category and tags of their Object, so one scan of the
// lighter table answers the usage question for every owner at once.
export async function countSharedTaxonomyUsage(ctx: ReaderCtx): Promise<SharedTaxonomyUsage> {
    const markers = await ctx.db.query('markers').collect();

    const usage: SharedTaxonomyUsage = {categories: new Map(), tags: new Map()};
    for (const marker of markers) {
        countOne(usage.categories, marker.categoryId);
        for (const tagId of new Set(marker.tagIds)) {
            countOne(usage.tags, tagId);
        }
    }
    return usage;
}

export async function countPrivateTagUsage(ctx: ReaderCtx, userId: Id<'users'>) {
    const rows = await listPrivateTagRowsOf(ctx, userId);

    const usage = new Map<Id<'privateTags'>, number>();
    for (const row of rows) {
        for (const tagId of new Set(row.privateTagIds)) {
            countOne(usage, tagId);
        }
    }
    return usage;
}

export async function listObjectIdsUsingCategory(ctx: ReaderCtx, categoryId: Id<'categories'>) {
    return collectObjectIds(await listMarkersUsingCategory(ctx, categoryId));
}

export async function listObjectIdsUsingTag(ctx: ReaderCtx, tagId: Id<'tags'>) {
    return collectObjectIds(await listMarkersUsingTag(ctx, tagId));
}

async function listMarkersUsingCategory(ctx: ReaderCtx, categoryId: Id<'categories'>) {
    return await ctx.db
        .query('markers')
        .withIndex('byCategoryId', q => q.eq('categoryId', categoryId))
        .collect();
}

async function listMarkersUsingTag(ctx: ReaderCtx, tagId: Id<'tags'>) {
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
    privateTag: Doc<'privateTags'>,
    replacementId: Id<'privateTags'> | null,
) {
    const privateTagId = privateTag._id;
    const rows = await listPrivateTagRowsOf(ctx, privateTag.createdById);
    const affected = rows.filter(row => row.privateTagIds.includes(privateTagId));
    for (const row of affected) {
        await ctx.db.patch('objectPrivateTags', row._id, {
            privateTagIds: rebuildIdList(row.privateTagIds, privateTagId, replacementId),
        });
    }
}

export function rebuildIdList<T extends string>(ids: T[], removedId: T, replacementId: T | null) {
    const kept = ids.filter(id => id !== removedId);
    if (replacementId !== null && !kept.includes(replacementId)) {
        kept.push(replacementId);
    }
    return kept;
}

function listPrivateTagRowsOf(ctx: ReaderCtx, userId: Id<'users'>) {
    return ctx.db
        .query('objectPrivateTags')
        .withIndex('byUserId', q => q.eq('userId', userId))
        .collect();
}

function collectObjectIds(markers: Doc<'markers'>[]) {
    return markers.map(marker => marker.objectId);
}

function countOne<K>(counter: Map<K, number>, key: K) {
    counter.set(key, (counter.get(key) ?? 0) + 1);
}
