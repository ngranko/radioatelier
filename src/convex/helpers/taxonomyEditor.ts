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
    assertNoIncomingMigration,
    assertNotSelf,
    loadAvailableTaxonomy,
    taxonomyError,
} from './taxonomyGuards';
import {
    findPrivateTagByName,
    findTagByName,
    normalizeCategoryName,
    normalizeTagName,
} from './taxonomyNames';

export async function renameCategory(ctx: MutationCtx, id: Id<'categories'>, name: string) {
    const category = await loadAvailableTaxonomy(ctx, 'categories', id);
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
// sit on more Objects than one mutation may write, so removal runs as
// scheduled batches that delete it once no Object refers to it anymore.
export async function removeCategory(
    ctx: MutationCtx,
    id: Id<'categories'>,
    replacementId: Id<'categories'> | null,
) {
    await loadAvailableTaxonomy(ctx, 'categories', id);
    await assertNoIncomingMigration(ctx, 'categories', id);
    const replacement = await loadReplacement(ctx, 'categories', id, replacementId);
    if (!replacement && (await listObjectIdsUsingCategory(ctx, id)).length > 0) {
        throw taxonomyError('categoryInUse');
    }
    await ctx.db.patch('categories', id, {
        isDeleting: true,
        deletionReplacementId: replacement?._id,
    });
    await ctx.scheduler.runAfter(0, internal.taxonomyRewrites.moveObjectsToCategory, {
        categoryId: id,
        replacementId: replacement?._id ?? null,
    });
}

export async function renameTag(ctx: MutationCtx, id: Id<'tags'>, name: string) {
    const tag = await loadAvailableTaxonomy(ctx, 'tags', id);
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
    await loadAvailableTaxonomy(ctx, 'tags', id);
    await assertNoIncomingMigration(ctx, 'tags', id);
    const replacement = await loadReplacement(ctx, 'tags', id, replacementId);
    await ctx.db.patch('tags', id, {
        isDeleting: true,
        deletionReplacementId: replacement?._id,
    });
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

async function loadReplacement<T extends 'categories' | 'tags'>(
    ctx: MutationCtx,
    table: T,
    id: Id<T>,
    replacementId: Id<T> | null,
) {
    assertNotSelf(id, replacementId);
    return replacementId === null ? null : await loadAvailableTaxonomy(ctx, table, replacementId);
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
