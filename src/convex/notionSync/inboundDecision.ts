import type {Id} from '../_generated/dataModel';
import type {NotionPageFields} from '../notion/types';
import {computeNotionToAppDiff, computeSyncHash} from './reconcile';
import type {ObjectSyncSnapshot} from './snapshot';
import type {AppSyncApplyPatch, AppSyncPatch} from './types';

type ExistingSyncRecord = {
    objectId: Id<'objects'>;
    lastOutboundHash: string | null;
};

type InboundPageState = 'active' | 'removed';

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
        patch: buildApplyPatch(
            computeNotionToAppDiff(existingSnapshot.fields, notionFields).appPatch,
        ),
    };
}

// Raw diffs retain nulls for audit; the apply patch drops them so inbound sync
// keeps existing app values rather than clearing them.
function buildApplyPatch(patch: AppSyncPatch): AppSyncApplyPatch {
    return Object.fromEntries(
        Object.entries(patch).filter(([, value]) => value !== null),
    ) as AppSyncApplyPatch;
}
