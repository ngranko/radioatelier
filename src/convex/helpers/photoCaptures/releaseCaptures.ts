import type {Id} from '../../_generated/dataModel';
import type {MutationCtx} from '../../_generated/server';

// A photo filed into an Object by hand is done with its capture: the analysis
// either gave up on it or would now add a second Object for the same photo.
export async function releaseCapturesHolding(
    ctx: MutationCtx,
    userId: Id<'users'>,
    imageIds: Id<'images'>[],
) {
    for (const imageId of imageIds) {
        const capture = await ctx.db
            .query('photoCaptures')
            .withIndex('byImageId', q => q.eq('imageId', imageId))
            .first();
        if (capture?.createdById === userId) {
            await ctx.db.delete('photoCaptures', capture._id);
        }
    }
}
