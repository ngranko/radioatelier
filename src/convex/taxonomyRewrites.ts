import {v} from 'convex/values';
import {internal} from './_generated/api';
import {internalMutation} from './_generated/server';
import {moveCategoryBatch, replaceTagBatch} from './helpers/objectTaxonomy';
import {deleteCategory} from './helpers/taxonomyEditor';
import {scheduleTaxonomyFanout} from './helpers/taxonomyFanout';

// Each run rewrites one bounded batch and hands the rest to the next run; the
// taxonomy is deleted in the run that finds nothing left, so no committed
// batch is ever left pointing at a missing document.
export const moveObjectsToCategory = internalMutation({
    args: {categoryId: v.id('categories'), replacementId: v.id('categories')},
    handler: async (ctx, args) => {
        const replacement = await ctx.db.get('categories', args.replacementId);
        if (!replacement) {
            throw new Error(`Replacement category ${args.replacementId} no longer exists`);
        }

        const {objectIds, isDone} = await moveCategoryBatch(ctx, args.categoryId, replacement._id);
        await scheduleTaxonomyFanout(ctx, objectIds, replacement.name);
        if (!isDone) {
            await ctx.scheduler.runAfter(0, internal.taxonomyRewrites.moveObjectsToCategory, args);
        } else if (await ctx.db.get('categories', args.categoryId)) {
            await deleteCategory(ctx, args.categoryId);
        }
    },
});

export const replaceTagOnObjects = internalMutation({
    args: {
        tagId: v.id('tags'),
        replacementId: v.nullable(v.id('tags')),
        cursor: v.nullable(v.string()),
    },
    handler: async (ctx, {tagId, replacementId, cursor}) => {
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
