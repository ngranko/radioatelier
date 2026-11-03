import {internal} from '../_generated/api';
import type {Doc, Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import type {ObjectPersonalData} from '../sharedValidators';
import {getIsVisited, updateIsVisited} from './objectHelpers';
import {upsertPrivateTags} from './objectWriter';

export async function updateObjectPersonalState(
    ctx: MutationCtx,
    objectId: Id<'objects'>,
    user: Doc<'users'>,
    data: ObjectPersonalData,
) {
    const object = await ctx.db.get('objects', objectId);
    if (!object) {
        throw new Error('Object not found');
    }
    const isOwner = object.createdById === user._id;
    if (!isOwner && !object.isPublic) {
        throw new Error('Not allowed to update this object');
    }
    const shouldCheckSync = isOwner && user.notionSyncEnabled;
    const wasVisited = shouldCheckSync ? await getIsVisited(ctx, objectId, user._id) : null;
    await upsertPrivateTags(ctx, objectId, user._id, data.privateTags);
    await updateIsVisited(ctx, objectId, user._id, data.isVisited);
    if (shouldCheckSync && wasVisited !== data.isVisited) {
        await ctx.scheduler.runAfter(0, internal.notionSync.outbound.enqueueOutboundObjectSync, {
            objectId,
        });
    }
    return objectId;
}
