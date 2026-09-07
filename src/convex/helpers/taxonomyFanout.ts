import {internal} from '../_generated/api';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {buildObjectSearchRecord} from './objectAggregate';

const FANOUT_BATCH_SIZE = 100;

// A taxonomy edit can touch far more Objects than a single form save, so the
// downstream work is batched instead of scheduled once per Object.
export async function scheduleTaxonomyFanout(
    ctx: MutationCtx,
    objectIds: Id<'objects'>[],
    searchCategoryName: string | null,
) {
    const uniqueIds = [...new Set(objectIds)];
    if (uniqueIds.length === 0) {
        return;
    }

    if (searchCategoryName !== null) {
        await scheduleSearchUpdates(ctx, uniqueIds, searchCategoryName);
    }
    for (const batch of splitIntoBatches(uniqueIds)) {
        await ctx.scheduler.runAfter(
            0,
            internal.notionSync.outbound.enqueueOutboundObjectSyncBatchLenient,
            {objectIds: batch},
        );
    }
}

async function scheduleSearchUpdates(
    ctx: MutationCtx,
    objectIds: Id<'objects'>[],
    categoryName: string,
) {
    const records = [];
    for (const objectId of objectIds) {
        const object = await ctx.db.get('objects', objectId);
        const mapPoint = object ? await ctx.db.get('mapPoints', object.mapPointId) : null;
        if (!object || !mapPoint) {
            continue;
        }
        records.push(
            buildObjectSearchRecord({
                id: object._id,
                name: object.name,
                mapPoint,
                categoryName,
                createdBy: object.createdById,
                isPublic: object.isPublic,
            }),
        );
    }

    for (const batch of splitIntoBatches(records)) {
        await ctx.scheduler.runAfter(0, internal.typesense.updateManyInTypesense, {objects: batch});
    }
}

function splitIntoBatches<T>(items: T[]) {
    const batches: T[][] = [];
    for (let index = 0; index < items.length; index += FANOUT_BATCH_SIZE) {
        batches.push(items.slice(index, index + FANOUT_BATCH_SIZE));
    }
    return batches;
}
