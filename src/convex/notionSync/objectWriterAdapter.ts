import type {MutationCtx} from '../_generated/server';
import {ensureCategory, ensureTags} from '../helpers/importHelpers';
import {getIsVisited} from '../helpers/objectHelpers';
import type {ObjectRecordData, ObjectRecordPatch, ObjectTarget} from '../helpers/objectWriter';
import type {
    CreateSyncedObjectInput,
    PatchSyncedObjectInput,
    SyncClassification,
} from './objectWriterTypes';
import {buildAppFields, normalizeCategoryName, normalizeNames, readTagNames} from './snapshot';
import type {AppSyncPatch} from './types';

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

// `null` in a sync patch means "Notion has no value" — we keep the app value
// rather than clearing it, matching the long-standing inbound behaviour.
// Fields outside the sync vocabulary (isPublic, description, cover, private
// tags) never appear here, so the writer never touches them on inbound sync.
export function buildSyncRecordPatch(
    patch: AppSyncPatch,
    classification: SyncClassification,
): ObjectRecordPatch {
    return {
        name: patch.name,
        installedPeriod: patch.installedPeriod ?? undefined,
        isRemoved: patch.isRemoved,
        removalPeriod: patch.removalPeriod ?? undefined,
        source: patch.source ?? undefined,
        categoryId: classification.categoryId,
        tagIds: classification.tagIds,
        address: patch.address ?? undefined,
        city: patch.city ?? undefined,
        country: patch.country ?? undefined,
    };
}

export async function buildPatchedFields(
    ctx: MutationCtx,
    target: ObjectTarget,
    input: PatchSyncedObjectInput,
    classification: SyncClassification,
) {
    return buildAppFields({
        objectId: target.object._id,
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
