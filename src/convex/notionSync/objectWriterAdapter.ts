import type {Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {ensureCategory, ensureTags} from '../helpers/importHelpers';
import type {ObjectRecordData, ObjectRecordPatch, ObjectTarget} from '../helpers/objectWriter';
import type {NotionPageFields} from '../notion/types';
import {requiredFieldsErrorMessage} from './inboundDecision';
import type {AppSyncApplyPatch} from './types';

export type CreateSyncedObjectInput = {
    notionPageId: string;
    ownerId: Id<'users'>;
    latitude: number;
    longitude: number;
    fields: NotionPageFields;
    lastInboundEditedTime: string | null;
};

export type PatchSyncedObjectInput = {
    objectId: Id<'objects'>;
    notionPageId: string;
    patch: AppSyncApplyPatch;
    lastInboundEditedTime: string | null;
};

export type SyncClassification = {
    categoryId: Id<'categories'>;
    tagIds: Id<'tags'>[];
};

export async function resolveCreateClassification(
    ctx: MutationCtx,
    input: CreateSyncedObjectInput,
): Promise<SyncClassification> {
    const categoryName = normalizeCategoryName(input.fields.categoryName);
    if (!categoryName) {
        throw new Error(requiredFieldsErrorMessage(['categoryName']));
    }
    const tagNames = normalizeNames(input.fields.tagNames);
    return {
        categoryId: await ensureCategory(ctx, categoryName),
        tagIds: await ensureTags(ctx, tagNames),
    };
}

export async function resolvePatchClassification(
    ctx: MutationCtx,
    target: ObjectTarget,
    input: PatchSyncedObjectInput,
): Promise<SyncClassification> {
    const categoryName = normalizeCategoryName(input.patch.categoryName) ?? target.category.name;
    const tagNames = input.patch.tagNames ? normalizeNames(input.patch.tagNames) : null;
    return {
        categoryId:
            normalizeCategoryName(categoryName) === normalizeCategoryName(target.category.name)
                ? target.category._id
                : await ensureCategory(ctx, categoryName),
        tagIds: tagNames ? await ensureTags(ctx, tagNames) : target.object.tagIds,
    };
}

export function buildSyncCreateData(
    input: CreateSyncedObjectInput,
    classification: SyncClassification,
): ObjectRecordData {
    const name = input.fields.name?.trim();
    if (!name) {
        throw new Error(requiredFieldsErrorMessage(['name']));
    }
    return {
        name,
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
        address: input.fields.address,
        city: input.fields.city,
        country: input.fields.country,
    };
}

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

function normalizeCategoryName(value: string | null | undefined) {
    const normalized = value?.trim().toLowerCase();
    return normalized || null;
}

function normalizeNames(values: string[]) {
    return [...new Set(values.map(item => item.trim().toLowerCase()).filter(Boolean))];
}
