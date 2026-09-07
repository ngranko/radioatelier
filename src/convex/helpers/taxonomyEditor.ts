import {ConvexError} from 'convex/values';
import type {Doc, Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {
    listMarkersUsingCategory,
    listMarkersUsingTag,
    moveObjectsToCategory,
    replacePrivateTagOnObjects,
    replaceTagOnObjects,
} from './objectTaxonomy';
import {
    findTaxonomyByName,
    loadTaxonomyOrThrow,
    normalizeTaxonomyName,
    resolveTaxonomyRef,
    type TaxonomyRef,
} from './taxonomyRef';

// `searchCategoryName` is the category name the touched Objects end up with,
// and is null whenever the edit cannot move a search record.
export type TaxonomyEditResult = {
    objectIds: Id<'objects'>[];
    searchCategoryName: string | null;
};

export async function renameTaxonomy(
    ctx: MutationCtx,
    ref: TaxonomyRef,
    name: string,
): Promise<TaxonomyEditResult> {
    const normalizedName = normalizeTaxonomyName(name);
    await loadTaxonomyOrThrow(ctx, ref);

    const conflict = await findTaxonomyByName(ctx, ref, normalizedName);
    if (conflict && conflict._id !== ref.id) {
        throw new ConvexError('Taxonomy name is already taken');
    }

    if (ref.type === 'category') {
        await ctx.db.patch('categories', ref.id, {name: normalizedName});
        const markers = await listMarkersUsingCategory(ctx, ref.id);
        return {
            objectIds: markers.map(marker => marker.objectId),
            searchCategoryName: normalizedName,
        };
    }

    if (ref.type === 'tag') {
        await ctx.db.patch('tags', ref.id, {name: normalizedName});
        const markers = await listMarkersUsingTag(ctx, ref.id);
        return {objectIds: markers.map(marker => marker.objectId), searchCategoryName: null};
    }

    await ctx.db.patch('privateTags', ref.id, {name: normalizedName});
    return {objectIds: [], searchCategoryName: null};
}

export async function removeTaxonomy(
    ctx: MutationCtx,
    ref: TaxonomyRef,
    replacementId: string | null,
): Promise<TaxonomyEditResult> {
    const taxonomy = await loadTaxonomyOrThrow(ctx, ref);
    const replacement = await resolveReplacement(ctx, ref, replacementId);

    if (ref.type === 'category') {
        return await removeCategory(ctx, ref.id, replacement as Doc<'categories'> | null);
    }

    if (ref.type === 'tag') {
        const replacementTag = replacement as Doc<'tags'> | null;
        const objectIds = await replaceTagOnObjects(ctx, ref.id, replacementTag?._id ?? null);
        await ctx.db.delete('tags', ref.id);
        return {objectIds, searchCategoryName: null};
    }

    const replacementPrivateTag = replacement as Doc<'privateTags'> | null;
    assertSameOwner(taxonomy as Doc<'privateTags'>, replacementPrivateTag);
    await replacePrivateTagOnObjects(ctx, ref.id, replacementPrivateTag?._id ?? null);
    await ctx.db.delete('privateTags', ref.id);
    return {objectIds: [], searchCategoryName: null};
}

// Objects cannot exist without a category, so dropping one that is still in
// use is only possible by moving its Objects somewhere else.
async function removeCategory(
    ctx: MutationCtx,
    categoryId: Id<'categories'>,
    replacement: Doc<'categories'> | null,
): Promise<TaxonomyEditResult> {
    if (!replacement) {
        const markers = await listMarkersUsingCategory(ctx, categoryId);
        if (markers.length > 0) {
            throw new ConvexError('Category is still in use');
        }
    }

    const objectIds = replacement
        ? await moveObjectsToCategory(ctx, categoryId, replacement._id)
        : [];
    await removeCategoryStyles(ctx, categoryId);
    await ctx.db.delete('categories', categoryId);

    return {objectIds, searchCategoryName: replacement?.name ?? null};
}

async function removeCategoryStyles(ctx: MutationCtx, categoryId: Id<'categories'>) {
    const styles = await ctx.db
        .query('userCategoryMarkerStyles')
        .filter(q => q.eq(q.field('categoryId'), categoryId))
        .collect();
    for (const style of styles) {
        await ctx.db.delete('userCategoryMarkerStyles', style._id);
    }
}

async function resolveReplacement(
    ctx: MutationCtx,
    ref: TaxonomyRef,
    replacementId: string | null,
) {
    if (replacementId === null) {
        return null;
    }
    if (replacementId === ref.id) {
        throw new ConvexError('A taxonomy cannot replace itself');
    }
    return await loadTaxonomyOrThrow(ctx, resolveTaxonomyRef(ctx, ref.type, replacementId));
}

function assertSameOwner(privateTag: Doc<'privateTags'>, replacement: Doc<'privateTags'> | null) {
    if (replacement && replacement.createdById !== privateTag.createdById) {
        throw new ConvexError('Private tags can only be merged within one owner');
    }
}
