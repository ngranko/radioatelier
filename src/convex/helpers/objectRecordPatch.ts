import {
    type MapPointCoreData,
    type ObjectCoreData,
    mapPointCoreFields,
    objectCoreFields,
} from '../sharedValidators';

type ObjectFields = ObjectCoreData;

// The table allows null address parts, but the writer always stores concrete
// strings ('' when unknown) — callers normalize before reaching this module.
type MapPointFields = {[K in keyof MapPointCoreData]: NonNullable<MapPointCoreData[K]>};

export type ObjectRecordData = ObjectFields & MapPointFields;
// Replace deliberately omits coordinates: the form edits fields in place,
// while repositioning is a separate gesture that goes through `patch`.
export type ObjectRecordReplace = ObjectFields & Omit<MapPointFields, 'latitude' | 'longitude'>;
export type ObjectRecordPatch = Partial<ObjectRecordData>;

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

export function hasKeys(patch: object) {
    return Object.keys(patch).length > 0;
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
