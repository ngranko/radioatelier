import {v} from 'convex/values';
import {internal} from './_generated/api';
import type {Id} from './_generated/dataModel';
import {internalMutation, type MutationCtx} from './_generated/server';
import {moveCategoryBatch, replaceTagBatch} from './helpers/objectTaxonomy';
import {scheduleTaxonomyFanout} from './helpers/taxonomyFanout';
import {loadAvailableTaxonomy} from './helpers/taxonomyGuards';

// Each run rewrites one bounded batch and hands the rest to the next run; the
// taxonomy is deleted in the run that finds nothing left, so no committed
// batch is ever left pointing at a missing document.
export const moveObjectsToCategory = internalMutation({
    args: {categoryId: v.id('categories'), replacementId: v.nullable(v.id('categories'))},
    handler: async (ctx, {categoryId, replacementId}) => {
        if (!(await ctx.db.get('categories', categoryId))) {
            return;
        }
        // Without a replacement the category was unused when removal started,
        // and its deleting state has refused new assignments since.
        const isDone =
            replacementId === null || (await moveNextBatch(ctx, categoryId, replacementId));
        if (!isDone) {
            await ctx.scheduler.runAfter(0, internal.taxonomyRewrites.moveObjectsToCategory, {
                categoryId,
                replacementId,
            });
            return;
        }
        await deleteCategory(ctx, categoryId);
    },
});

async function moveNextBatch(
    ctx: MutationCtx,
    categoryId: Id<'categories'>,
    replacementId: Id<'categories'>,
) {
    const replacement = await loadAvailableTaxonomy(ctx, 'categories', replacementId);
    const {objectIds, isDone} = await moveCategoryBatch(ctx, categoryId, replacement._id);
    await scheduleTaxonomyFanout(ctx, objectIds, replacement.name);
    return isDone;
}

async function deleteCategory(ctx: MutationCtx, categoryId: Id<'categories'>) {
    const styles = await ctx.db
        .query('userCategoryMarkerStyles')
        .withIndex('byCategoryId', q => q.eq('categoryId', categoryId))
        .collect();
    for (const style of styles) {
        await ctx.db.delete('userCategoryMarkerStyles', style._id);
    }
    await ctx.db.delete('categories', categoryId);
}

export const replaceTagOnObjects = internalMutation({
    args: {
        tagId: v.id('tags'),
        replacementId: v.nullable(v.id('tags')),
        cursor: v.nullable(v.string()),
    },
    handler: async (ctx, {tagId, replacementId, cursor}) => {
        if (!(await ctx.db.get('tags', tagId))) {
            return;
        }
        if (replacementId !== null) {
            await loadAvailableTaxonomy(ctx, 'tags', replacementId);
        }
        const batch = await replaceTagBatch(ctx, tagId, replacementId, cursor);
        await scheduleTaxonomyFanout(ctx, batch.objectIds, null);
        if (!batch.isDone) {
            await ctx.scheduler.runAfter(0, internal.taxonomyRewrites.replaceTagOnObjects, {
                tagId,
                replacementId,
                cursor: batch.cursor,
            });
        } else if (await ctx.db.get('tags', tagId)) {
            await ctx.db.delete('tags', tagId);
        }
    },
});
