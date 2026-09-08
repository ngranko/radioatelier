import {internal} from '../_generated/api';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';

// A taxonomy edit can touch far more Objects than a single form save, so the
// downstream work is scheduled once for the whole list instead of per Object.
// Notion works through the list in sequence to stay under its rate limit.
export async function scheduleTaxonomyFanout(
    ctx: MutationCtx,
    objectIds: Id<'objects'>[],
    searchCategoryName: string | null,
) {
    if (objectIds.length === 0) {
        return;
    }

    if (searchCategoryName !== null) {
        await ctx.scheduler.runAfter(0, internal.typesense.setCategoryNameInTypesenseBatch, {
            objectIds,
            categoryName: searchCategoryName,
        });
    }
    await ctx.scheduler.runAfter(
        0,
        internal.notionSync.outbound.enqueueOutboundObjectSyncBatchLenient,
        {objectIds},
    );
}
