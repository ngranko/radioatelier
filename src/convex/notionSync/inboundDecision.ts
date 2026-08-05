import type {Id} from '../_generated/dataModel';
import type {NotionPageFields} from '../notion/types';
import {computeNotionToAppDiff, computeSyncHash} from './reconcile';
import type {ObjectSyncSnapshot} from './snapshot';
import type {AppSyncApplyPatch} from './types';

type ExistingSyncRecord = {
    objectId: Id<'objects'>;
    lastOutboundHash: string | null;
};

type InboundPageState = 'active' | 'removed';

type RequiredSyncField = 'name' | 'categoryName';

export type InboundSyncDecision =
    | {kind: 'skip'}
    | {kind: 'deleteObject'; objectId: Id<'objects'>}
    | {
          kind: 'recordEcho';
          objectId: Id<'objects'>;
          lastOutboundHash: string | null;
      }
    | {
          kind: 'patchObject';
          objectId: Id<'objects'>;
          patch: AppSyncApplyPatch;
      }
    | {
          kind: 'createObject';
          fields: NotionPageFields;
      }
    | {
          kind: 'rejectInbound';
          objectId?: Id<'objects'>;
          fields: RequiredSyncField[];
      };

export function decideInboundSync(input: {
    eventType: string;
    pageState: InboundPageState;
    existingSync: ExistingSyncRecord | null;
    notionFields: NotionPageFields | null;
    existingSnapshot: ObjectSyncSnapshot | null;
}): InboundSyncDecision {
    if (input.pageState === 'removed') {
        return input.existingSync
            ? {kind: 'deleteObject', objectId: input.existingSync.objectId}
            : {kind: 'skip'};
    }

    if (!input.notionFields) {
        return {kind: 'skip'};
    }

    const missing = missingRequiredFields(input.notionFields);
    if (missing.length > 0) {
        return {
            kind: 'rejectInbound',
            ...(input.existingSync ? {objectId: input.existingSync.objectId} : {}),
            fields: missing,
        };
    }

    if (input.existingSync) {
        return decideExistingObject(input.existingSync, input.notionFields, input.existingSnapshot);
    }

    if (input.eventType !== 'page.created') {
        return {kind: 'skip'};
    }

    return {kind: 'createObject', fields: input.notionFields};
}

function decideExistingObject(
    existingSync: ExistingSyncRecord,
    notionFields: NotionPageFields,
    existingSnapshot: ObjectSyncSnapshot | null,
): InboundSyncDecision {
    const notionHash = computeSyncHash(notionFields);
    if (existingSync.lastOutboundHash === notionHash) {
        return {
            kind: 'recordEcho',
            objectId: existingSync.objectId,
            lastOutboundHash: existingSync.lastOutboundHash,
        };
    }

    if (!existingSnapshot) {
        return {kind: 'skip'};
    }

    return {
        kind: 'patchObject',
        objectId: existingSync.objectId,
        // Required name/category are already non-empty on notionFields; nullable
        // empties stay as null so the writer clears them.
        patch: computeNotionToAppDiff(existingSnapshot.fields, notionFields)
            .appPatch as AppSyncApplyPatch,
    };
}

function missingRequiredFields(fields: NotionPageFields): RequiredSyncField[] {
    const missing: RequiredSyncField[] = [];
    if (!hasRequiredText(fields.name)) {
        missing.push('name');
    }
    if (!hasRequiredText(fields.categoryName)) {
        missing.push('categoryName');
    }
    return missing;
}

function hasRequiredText(value: string | null | undefined): value is string {
    return typeof value === 'string' && value.trim() !== '';
}

export function requiredFieldsErrorMessage(fields: RequiredSyncField[]) {
    return `Inbound Notion sync refused empty required field(s): ${fields.join(', ')}`;
}
