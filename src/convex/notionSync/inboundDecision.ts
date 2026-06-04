import type {Id} from '../_generated/dataModel';
import type {NotionPageFields} from '../notion/types';
import {computeNotionToAppDiff, computeSyncHash} from './reconcile';
import type {ObjectSyncSnapshot} from './snapshot';
import type {AppSyncPatch} from './types';

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
          patch: AppSyncPatch;
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
        patch: computeNotionToAppDiff(existingSnapshot.fields, notionFields).appPatch,
    };
}
