import {internal} from '../../_generated/api';
import type {Doc} from '../../_generated/dataModel';
import type {MutationCtx} from '../../_generated/server';
import {updateIsVisited} from '../objectHelpers';
import {replaceObjectImages} from '../objectImages';
import {createObjectRecords} from '../objectWriter';
import type {PhotoAnalysis} from './analysisPrompt';

// The capture already holds what the camera knew; the analysis adds what the
// photo shows. Everything else starts empty for the owner to fill in on review.
export async function createCapturedObject(
    ctx: MutationCtx,
    capture: Doc<'photoCaptures'>,
    analysis: PhotoAnalysis,
) {
    const ownerId = capture.createdById;
    const {objectId} = await createObjectRecords(ctx, ownerId, {
        ...analysis,
        description: null,
        installedPeriod: null,
        removalPeriod: null,
        source: null,
        isPublic: false,
        isRemoved: false,
        isPendingReview: true,
        latitude: capture.latitude,
        longitude: capture.longitude,
        address: capture.address,
        city: capture.city,
        country: capture.country,
    });
    await replaceObjectImages(ctx, objectId, ownerId, [capture.imageId]);
    await updateIsVisited(ctx, objectId, ownerId, true);

    const owner = await ctx.db.get('users', ownerId);
    if (owner?.notionSyncEnabled) {
        await ctx.scheduler.runAfter(0, internal.notionSync.outbound.enqueueOutboundObjectSync, {
            objectId,
        });
    }
    return objectId;
}
