import {internal} from '../_generated/api';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {findCategoryByName} from './importHelpers';
import {
    listObjectIdsUsingCategory,
    listObjectIdsUsingTag,
    replacePrivateTagOnObjects,
} from './objectTaxonomy';
import {scheduleTaxonomyFanout} from './taxonomyFanout';
import {
    assertNameAvailable,
    findPrivateTagByName,
    findTagByName,
    normalizeCategoryName,
    normalizeTagName,
    taxonomyError,
} from './taxonomyNames';

type TaxonomyTable = 'categories' | 'tags' | 'privateTags';

export async function renameCategory(ctx: MutationCtx, id: Id<'categories'>, name: string) {
    const category = await loadTaxonomy(ctx, 'categories', id);
    const normalizedName = normalizeCategoryName(name);
    if (normalizedName === category.name) {
        return;
    }

    assertNameAvailable(await findCategoryByName(ctx, normalizedName), id);
    await ctx.db.patch('categories', id, {name: normalizedName});
    await scheduleTaxonomyFanout(ctx, await listObjectIdsUsingCategory(ctx, id), normalizedName);
}

// Objects cannot exist without a category, so dropping one that is still in
// use is only possible by moving its Objects somewhere else. A taxonomy can
// sit on more Objects than one mutation may write, so replacing it runs as
// scheduled batches that delete it once no Object refers to it anymore.
export async function removeCategory(
    ctx: MutationCtx,
    id: Id<'categories'>,
    replacementId: Id<'categories'> | null,
) {
    await loadTaxonomy(ctx, 'categories', id);
    const replacement = await loadReplacement(ctx, 'categories', id, replacementId);
    if (replacement) {
        await ctx.scheduler.runAfter(0, internal.taxonomyRewrites.moveObjectsToCategory, {
            categoryId: id,
            replacementId: replacement._id,
        });
        return;
    }
    if ((await listObjectIdsUsingCategory(ctx, id)).length > 0) {
        throw taxonomyError('categoryInUse');
    }
    await deleteCategory(ctx, id);
}

export async function deleteCategory(ctx: MutationCtx, id: Id<'categories'>) {
    await removeCategoryStyles(ctx, id);
    await ctx.db.delete('categories', id);
}

export async function renameTag(ctx: MutationCtx, id: Id<'tags'>, name: string) {
    const tag = await loadTaxonomy(ctx, 'tags', id);
    const normalizedName = normalizeTagName(name);
    if (normalizedName === tag.name) {
        return;
    }

    assertNameAvailable(await findTagByName(ctx, normalizedName), id);
    await ctx.db.patch('tags', id, {name: normalizedName});
    await scheduleTaxonomyFanout(ctx, await listObjectIdsUsingTag(ctx, id), null);
}

export async function removeTag(
    ctx: MutationCtx,
    id: Id<'tags'>,
    replacementId: Id<'tags'> | null,
) {
    await loadTaxonomy(ctx, 'tags', id);
    const replacement = await loadReplacement(ctx, 'tags', id, replacementId);
    await ctx.scheduler.runAfter(0, internal.taxonomyRewrites.replaceTagOnObjects, {
        tagId: id,
        replacementId: replacement?._id ?? null,
        cursor: null,
    });
}

// Private tags reach neither search nor Notion, so their edits schedule nothing.
export async function renamePrivateTag(
    ctx: MutationCtx,
    ownerId: Id<'users'>,
    id: Id<'privateTags'>,
    name: string,
) {
    const privateTag = await loadOwnPrivateTag(ctx, ownerId, id);
    const normalizedName = normalizeTagName(name);
    if (normalizedName === privateTag.name) {
        return;
    }

    assertNameAvailable(await findPrivateTagByName(ctx, ownerId, normalizedName), id);
    await ctx.db.patch('privateTags', id, {name: normalizedName});
}

export async function removePrivateTag(
    ctx: MutationCtx,
    ownerId: Id<'users'>,
    id: Id<'privateTags'>,
    replacementId: Id<'privateTags'> | null,
) {
    const privateTag = await loadOwnPrivateTag(ctx, ownerId, id);
    assertNotSelf(id, replacementId);
    const replacement =
        replacementId === null ? null : await loadOwnPrivateTag(ctx, ownerId, replacementId);
    await replacePrivateTagOnObjects(ctx, privateTag, replacement?._id ?? null);
    await ctx.db.delete('privateTags', id);
}

async function loadTaxonomy<T extends TaxonomyTable>(ctx: MutationCtx, table: T, id: Id<T>) {
    const taxonomy = await ctx.db.get(table, id);
    if (!taxonomy) {
        throw taxonomyError('notFound');
    }
    return taxonomy;
}

async function loadReplacement<T extends TaxonomyTable>(
    ctx: MutationCtx,
    table: T,
    id: Id<T>,
    replacementId: Id<T> | null,
) {
    assertNotSelf(id, replacementId);
    return replacementId === null ? null : await loadTaxonomy(ctx, table, replacementId);
}

// Another user's private tag is reported as missing, so a guessed id does not
// reveal that it exists.
async function loadOwnPrivateTag(ctx: MutationCtx, ownerId: Id<'users'>, id: Id<'privateTags'>) {
    const privateTag = await ctx.db.get('privateTags', id);
    if (!privateTag || privateTag.createdById !== ownerId) {
        throw taxonomyError('notFound');
    }
    return privateTag;
}

function assertNotSelf(id: string, replacementId: string | null) {
    if (replacementId === id) {
        throw taxonomyError('selfReplacement');
    }
}

async function removeCategoryStyles(ctx: MutationCtx, categoryId: Id<'categories'>) {
    const styles = await ctx.db
        .query('userCategoryMarkerStyles')
        .withIndex('byCategoryId', q => q.eq('categoryId', categoryId))
        .collect();
    for (const style of styles) {
        await ctx.db.delete('userCategoryMarkerStyles', style._id);
    }
}
