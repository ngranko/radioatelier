import type {MutationCtx} from '../_generated/server';
import {ensureCategory, ensureTags} from '../helpers/importHelpers';
import type {ObjectRecordData, ObjectRecordPatch, ObjectTarget} from '../helpers/objectWriter';
import type {
    CreateSyncedObjectInput,
    PatchSyncedObjectInput,
    SyncClassification,
} from './objectWriterTypes';
import {normalizeCategoryName, normalizeNames} from './snapshot';
import type {AppSyncApplyPatch} from './types';

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
    target: ObjectTarget,
    input: PatchSyncedObjectInput,
): Promise<SyncClassification> {
    const categoryName = normalizeCategoryName(input.patch.categoryName) ?? target.category.name;
    const tagNames = input.patch.tagNames
        ? normalizeNames(input.patch.tagNames)
        : target.tags.map(tag => tag.name);
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

export function buildSyncCreateData(
    input: CreateSyncedObjectInput,
    classification: SyncClassification,
): ObjectRecordData {
    return {
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
        latitude: input.latitude,
        longitude: input.longitude,
        address: input.fields.address ?? '',
        city: input.fields.city ?? '',
        country: input.fields.country ?? '',
    };
}

// The apply patch is already null-free (keep-vs-clear is resolved by the
// inbound decision), so fields map straight through. Fields outside the sync
// vocabulary (isPublic, description, cover, private tags) never appear here,
// so the writer never touches them on inbound sync.
export function buildSyncRecordPatch(
    patch: AppSyncApplyPatch,
    classification: SyncClassification,
): ObjectRecordPatch {
    return {
        name: patch.name,
        installedPeriod: patch.installedPeriod,
        isRemoved: patch.isRemoved,
        removalPeriod: patch.removalPeriod,
        source: patch.source,
        categoryId: classification.categoryId,
        tagIds: classification.tagIds,
        address: patch.address,
        city: patch.city,
        country: patch.country,
    };
}
