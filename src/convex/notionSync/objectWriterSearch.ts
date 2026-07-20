import {internal} from '../_generated/api';
import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {buildObjectSearchRecord} from '../helpers/objectAggregate';
import type {ObjectTarget} from '../helpers/objectWriter';
import type {CreateSyncedObjectInput, PatchSyncedObjectInput} from './objectWriterTypes';

export async function scheduleCreateSearch(
    ctx: MutationCtx,
    input: CreateSyncedObjectInput,
    categoryName: string,
    objectId: Id<'objects'>,
) {
    await ctx.scheduler.runAfter(0, internal.typesense.createInTypesense, {
        object: buildObjectSearchRecord({
            id: objectId,
            name: input.fields.name ?? 'Untitled',
            mapPoint: {
                latitude: input.latitude,
                longitude: input.longitude,
                address: input.fields.address ?? '',
                city: input.fields.city ?? '',
                country: input.fields.country ?? '',
            },
            categoryName,
            createdBy: input.ownerId,
            isPublic: false,
        }),
    });
}

export async function scheduleUpdateSearch(
    ctx: MutationCtx,
    input: PatchSyncedObjectInput,
    target: ObjectTarget,
    categoryName: string,
) {
    await ctx.scheduler.runAfter(0, internal.typesense.updateInTypesense, {
        object: buildObjectSearchRecord({
            id: input.objectId,
            name: input.patch.name ?? target.object.name,
            mapPoint: {
                latitude: target.mapPoint.latitude,
                longitude: target.mapPoint.longitude,
                address: input.patch.address ?? target.mapPoint.address,
                city: input.patch.city ?? target.mapPoint.city,
                country: input.patch.country ?? target.mapPoint.country,
            },
            categoryName,
            createdBy: target.object.createdById,
            isPublic: target.object.isPublic,
        }),
    });
}
