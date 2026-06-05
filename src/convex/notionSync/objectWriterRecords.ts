import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {ensureCategory, ensureTags} from '../helpers/importHelpers';
import {getIsVisited, getNextInternalId, updateIsVisited} from '../helpers/objectHelpers';
import type {
    CreateSyncedObjectInput,
    PatchSyncedObjectInput,
    PatchTarget,
    SyncClassification,
} from './objectWriterTypes';
import {buildAppFields, normalizeCategoryName, normalizeNames, readTagNames} from './snapshot';

export async function resolveCreateClassification(
    ctx: MutationCtx,
    input: CreateSyncedObjectInput,
): Promise<SyncClassification> {
    const categoryName = normalizeCategoryName(input.fields.categoryName) ?? 'unknown';
    const tagNames = normalizeNames(input.fields.tagNames);
    return {
        categoryName,
        categoryId: await ensureCategory(ctx, categoryName),
        tagNames,
        tagIds: await ensureTags(ctx, tagNames),
    };
}

export async function resolvePatchClassification(
    ctx: MutationCtx,
    target: PatchTarget,
    input: PatchSyncedObjectInput,
): Promise<SyncClassification> {
    const categoryName = normalizeCategoryName(input.patch.categoryName) ?? target.category.name;
    const tagNames = input.patch.tagNames
        ? normalizeNames(input.patch.tagNames)
        : await readTagNames(ctx, target.object.tagIds);
    return {
        categoryName,
        categoryId:
            categoryName === target.category.name
                ? target.category._id
                : await ensureCategory(ctx, categoryName),
        tagNames,
        tagIds: input.patch.tagNames ? await ensureTags(ctx, tagNames) : target.object.tagIds,
    };
}

export async function insertMapPoint(ctx: MutationCtx, input: CreateSyncedObjectInput) {
    return await ctx.db.insert('mapPoints', {
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.fields.address ?? '',
        city: input.fields.city ?? '',
        country: input.fields.country ?? '',
    });
}

export async function insertObject(
    ctx: MutationCtx,
    input: CreateSyncedObjectInput,
    classification: SyncClassification,
    mapPointId: Id<'mapPoints'>,
) {
    return await ctx.db.insert('objects', {
        name: input.fields.name ?? 'Untitled',
        description: null,
        installedPeriod: input.fields.installedPeriod,
        isRemoved: input.fields.isRemoved,
        removalPeriod: input.fields.removalPeriod,
        source: input.fields.source,
        coverId: null,
        categoryId: classification.categoryId,
        isPublic: false,
        tagIds: classification.tagIds,
        mapPointId,
        createdById: input.ownerId,
        internalId: await getNextInternalId(ctx),
    });
}

export async function insertObjectRelations(
    ctx: MutationCtx,
    input: CreateSyncedObjectInput,
    classification: SyncClassification,
    objectId: Id<'objects'>,
) {
    await ctx.db.insert('objectPrivateTags', {
        objectId,
        privateTagIds: [],
        userId: input.ownerId,
    });
    await ctx.db.insert('markers', {
        objectId,
        latitude: input.latitude,
        longitude: input.longitude,
        createdById: input.ownerId,
        categoryId: classification.categoryId,
        tagIds: classification.tagIds,
        isRemoved: input.fields.isRemoved,
        isPublic: false,
    });
    await updateIsVisited(ctx, objectId, input.ownerId, input.fields.isVisited);
}

export async function loadPatchTarget(
    ctx: MutationCtx,
    objectId: Id<'objects'>,
): Promise<PatchTarget> {
    const object = await ctx.db.get('objects', objectId);
    if (!object) {
        throw new Error('Object not found');
    }
    const [mapPoint, category, marker] = await Promise.all([
        ctx.db.get('mapPoints', object.mapPointId),
        ctx.db.get('categories', object.categoryId),
        ctx.db
            .query('markers')
            .withIndex('byObjectId', q => q.eq('objectId', objectId))
            .unique(),
    ]);
    if (!mapPoint || !category || !marker) {
        throw new Error('Object relations not found');
    }
    return {object, mapPoint, category, marker};
}

export async function applyObjectPatch(
    ctx: MutationCtx,
    target: PatchTarget,
    input: PatchSyncedObjectInput,
    classification: SyncClassification,
) {
    await ctx.db.patch('objects', target.object._id, {
        name: input.patch.name ?? target.object.name,
        categoryId: classification.categoryId,
        installedPeriod: input.patch.installedPeriod ?? target.object.installedPeriod,
        isRemoved: input.patch.isRemoved ?? target.object.isRemoved,
        removalPeriod: input.patch.removalPeriod ?? target.object.removalPeriod,
        source: input.patch.source ?? target.object.source,
        tagIds: classification.tagIds,
    });
    await ctx.db.patch('mapPoints', target.object.mapPointId, {
        address: input.patch.address ?? target.mapPoint.address,
        city: input.patch.city ?? target.mapPoint.city,
        country: input.patch.country ?? target.mapPoint.country,
    });
    await ctx.db.patch('markers', target.marker._id, {
        categoryId: classification.categoryId,
        tagIds: classification.tagIds,
        isRemoved: input.patch.isRemoved ?? target.object.isRemoved,
    });
    if (input.patch.isVisited !== undefined) {
        await updateIsVisited(
            ctx,
            target.object._id,
            target.object.createdById,
            input.patch.isVisited,
        );
    }
}

export async function buildPatchedFields(
    ctx: MutationCtx,
    target: PatchTarget,
    input: PatchSyncedObjectInput,
    classification: SyncClassification,
) {
    return buildAppFields({
        objectId: target.object._id,
        internalId: target.object.internalId,
        name: input.patch.name ?? target.object.name,
        categoryName: classification.categoryName,
        address: input.patch.address ?? target.mapPoint.address,
        city: input.patch.city ?? target.mapPoint.city,
        country: input.patch.country ?? target.mapPoint.country,
        installedPeriod: input.patch.installedPeriod ?? target.object.installedPeriod,
        isRemoved: input.patch.isRemoved ?? target.object.isRemoved,
        removalPeriod: input.patch.removalPeriod ?? target.object.removalPeriod,
        tagNames: classification.tagNames,
        isVisited:
            input.patch.isVisited ??
            (await getIsVisited(ctx, target.object._id, target.object.createdById)),
        source: input.patch.source ?? target.object.source,
    });
}
