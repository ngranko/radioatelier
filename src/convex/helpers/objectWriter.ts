import type {Doc, Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {
    type MapPointCoreData,
    type ObjectCoreData,
    mapPointCoreFields,
    objectCoreFields,
} from '../sharedValidators';
import {getNextInternalId} from './objectHelpers';

type ObjectFields = ObjectCoreData;

// The table allows null address parts, but the writer always stores concrete
// strings ('' when unknown) — callers normalize before reaching this module.
type MapPointFields = {[K in keyof MapPointCoreData]: NonNullable<MapPointCoreData[K]>};

export type ObjectRecordData = ObjectFields & MapPointFields;
// Replace deliberately omits coordinates: the form edits fields in place,
// while repositioning is a separate gesture that goes through `patch`.
export type ObjectRecordReplace = ObjectFields & Omit<MapPointFields, 'latitude' | 'longitude'>;
export type ObjectRecordPatch = Partial<ObjectRecordData>;

export type ObjectTarget = {
    object: Doc<'objects'>;
    mapPoint: Doc<'mapPoints'>;
    category: Doc<'categories'>;
    marker: Doc<'markers'>;
};

export async function createObjectRecords(
    ctx: MutationCtx,
    ownerId: Id<'users'>,
    data: ObjectRecordData,
) {
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
    if (hasKeys(objectPatch)) {
        await ctx.db.patch('objects', target.object._id, objectPatch);
    }
    if (hasKeys(mapPointPatch)) {
        await ctx.db.patch('mapPoints', target.object.mapPointId, mapPointPatch);
    }
    if (hasKeys(markerPatch)) {
        await ctx.db.patch('markers', target.marker._id, markerPatch);
    }
}

const objectPatchKeys = Object.keys(objectCoreFields) as (keyof ObjectFields)[];
const mapPointPatchKeys = Object.keys(mapPointCoreFields) as (keyof MapPointFields)[];
const markerPatchKeys = [
    'latitude',
    'longitude',
    'categoryId',
    'tagIds',
    'isRemoved',
    'isPublic',
] as const;

// A field is written only when present (`undefined` means "leave as is",
// `null` is a real value). Callers encode their keep-vs-clear policy by
// shaping the patch, not by merging with current values.
export function splitObjectRecordPatch(patch: ObjectRecordPatch) {
    return {
        objectPatch: pickPresent(patch, objectPatchKeys),
        mapPointPatch: pickPresent(patch, mapPointPatchKeys),
        markerPatch: pickPresent(patch, markerPatchKeys),
    };
}

export function filterChangedPatch<T extends object>(record: object, patch: T): T {
    const result: Partial<Record<keyof T, unknown>> = {};
    const source = record as Record<keyof T, unknown>;
    for (const key of Object.keys(patch) as (keyof T)[]) {
        if (!arePatchValuesEqual(source[key], patch[key])) {
            result[key] = patch[key];
        }
    }
    return result as T;
}

function pickPresent<K extends keyof ObjectRecordPatch>(
    patch: ObjectRecordPatch,
    keys: readonly K[],
) {
    const result: Partial<Pick<ObjectRecordPatch, K>> = {};
    for (const key of keys) {
        if (patch[key] !== undefined) {
            result[key] = patch[key];
        }
    }
    return result;
}

function hasKeys(patch: object) {
    return Object.keys(patch).length > 0;
}

function arePatchValuesEqual(current: unknown, next: unknown) {
    if (Array.isArray(current) && Array.isArray(next)) {
        return haveSameItems(current, next);
    }
    return current === next;
}

function haveSameItems(left: unknown[], right: unknown[]) {
    const leftItems = new Set(left);
    const rightItems = new Set(right);
    return leftItems.size === rightItems.size && [...leftItems].every(item => rightItems.has(item));
}

export async function loadObjectTarget(
    ctx: MutationCtx,
    objectId: Id<'objects'>,
): Promise<ObjectTarget> {
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
