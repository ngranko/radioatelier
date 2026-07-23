import {internal} from '../_generated/api';
import type {Doc, Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {buildObjectSearchRecord} from './objectAggregate';
import {getNextInternalId} from './objectHelpers';
import {loadObjectAggregate} from './objectReader';
import {
    filterChangedPatch,
    hasKeys,
    type ObjectRecordData,
    type ObjectRecordPatch,
    type ObjectRecordReplace,
    splitObjectRecordPatch,
} from './objectRecordPatch';

export type {ObjectRecordData, ObjectRecordPatch, ObjectRecordReplace} from './objectRecordPatch';

export type ObjectTarget = {
    object: Doc<'objects'>;
    mapPoint: Doc<'mapPoints'>;
    category: Doc<'categories'>;
    marker: Doc<'markers'>;
    tags: Doc<'tags'>[];
};

export async function createObjectRecords(
    ctx: MutationCtx,
    ownerId: Id<'users'>,
    data: ObjectRecordData,
) {
    const category = await requireCategory(ctx, data.categoryId);
    const {latitude, longitude, address, city, country, ...object} = data;
    const mapPointId = await ctx.db.insert('mapPoints', {
        latitude,
        longitude,
        address,
        city,
        country,
    });
    const objectId = await ctx.db.insert('objects', {
        ...object,
        mapPointId,
        createdById: ownerId,
        internalId: await getNextInternalId(ctx),
    });
    await ctx.db.insert('markers', {
        objectId,
        latitude,
        longitude,
        createdById: ownerId,
        categoryId: object.categoryId,
        tagIds: object.tagIds,
        isRemoved: object.isRemoved,
        isPublic: object.isPublic,
    });
    await ctx.scheduler.runAfter(0, internal.typesense.createInTypesense, {
        object: buildObjectSearchRecord({
            id: objectId,
            name: data.name,
            mapPoint: {latitude, longitude, address, city, country},
            categoryName: category.name,
            createdBy: ownerId,
            isPublic: data.isPublic,
        }),
    });
    return {objectId, mapPointId};
}

export async function replaceObjectRecords(
    ctx: MutationCtx,
    target: ObjectTarget,
    data: ObjectRecordReplace,
) {
    await patchObjectRecords(ctx, target, data);
}

export async function patchObjectRecords(
    ctx: MutationCtx,
    target: ObjectTarget,
    patch: ObjectRecordPatch,
) {
    const patches = splitObjectRecordPatch(patch);
    const objectPatch = filterChangedPatch(target.object, patches.objectPatch);
    const mapPointPatch = filterChangedPatch(target.mapPoint, patches.mapPointPatch);
    const markerPatch = filterChangedPatch(target.marker, patches.markerPatch);
    if (!hasKeys(objectPatch) && !hasKeys(mapPointPatch) && !hasKeys(markerPatch)) {
        return;
    }
    if (hasKeys(objectPatch)) {
        await ctx.db.patch('objects', target.object._id, objectPatch);
    }
    if (hasKeys(mapPointPatch)) {
        await ctx.db.patch('mapPoints', target.object.mapPointId, mapPointPatch);
    }
    if (hasKeys(markerPatch)) {
        await ctx.db.patch('markers', target.marker._id, markerPatch);
    }
    await scheduleSearchUpdate(ctx, target, objectPatch, mapPointPatch);
}

// The search record mirrors post-write state, so it merges the applied
// patches over the loaded target instead of trusting caller-held copies —
// callers each hold different (sometimes stale) slices of the Object.
async function scheduleSearchUpdate(
    ctx: MutationCtx,
    target: ObjectTarget,
    objectPatch: ObjectRecordPatch,
    mapPointPatch: ObjectRecordPatch,
) {
    const category =
        objectPatch.categoryId && objectPatch.categoryId !== target.category._id
            ? await requireCategory(ctx, objectPatch.categoryId)
            : target.category;
    await ctx.scheduler.runAfter(0, internal.typesense.updateInTypesense, {
        object: buildObjectSearchRecord({
            id: target.object._id,
            name: objectPatch.name ?? target.object.name,
            mapPoint: {
                latitude: mapPointPatch.latitude ?? target.mapPoint.latitude,
                longitude: mapPointPatch.longitude ?? target.mapPoint.longitude,
                address: mapPointPatch.address ?? target.mapPoint.address,
                city: mapPointPatch.city ?? target.mapPoint.city,
                country: mapPointPatch.country ?? target.mapPoint.country,
            },
            categoryName: category.name,
            createdBy: target.object.createdById,
            isPublic: objectPatch.isPublic ?? target.object.isPublic,
        }),
    });
}

async function requireCategory(ctx: MutationCtx, categoryId: Id<'categories'>) {
    const category = await ctx.db.get('categories', categoryId);
    if (!category) {
        throw new Error('Category not found');
    }
    return category;
}

export async function loadObjectTarget(
    ctx: MutationCtx,
    objectId: Id<'objects'>,
): Promise<ObjectTarget> {
    const object = await ctx.db.get('objects', objectId);
    if (!object) {
        throw new Error('Object not found');
    }
    const [aggregate, marker] = await Promise.all([
        loadObjectAggregate(ctx, object),
        ctx.db
            .query('markers')
            .withIndex('byObjectId', q => q.eq('objectId', objectId))
            .unique(),
    ]);
    if (!aggregate || !marker) {
        throw new Error('Object relations not found');
    }
    return {
        object,
        mapPoint: aggregate.mapPoint,
        category: aggregate.category,
        marker,
        tags: aggregate.tags,
    };
}

export async function upsertPrivateTags(
    ctx: MutationCtx,
    objectId: Id<'objects'>,
    userId: Id<'users'>,
    privateTagIds: Id<'privateTags'>[],
) {
    const existing = await ctx.db
        .query('objectPrivateTags')
        .withIndex('byObjectIdUserId', q => q.eq('objectId', objectId).eq('userId', userId))
        .unique();
    if (existing) {
        await ctx.db.patch('objectPrivateTags', existing._id, {privateTagIds});
    } else {
        await ctx.db.insert('objectPrivateTags', {objectId, userId, privateTagIds});
    }
}
