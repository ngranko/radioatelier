import {v} from 'convex/values';
import type {Doc, Id} from '../_generated/dataModel';
import {internalMutation, internalQuery, type MutationCtx} from '../_generated/server';
import type {NotionPageFields} from '../notion/types';
import {computeSyncHash} from './reconcile';
import type {AppSyncFields} from './types';

export type SyncStateArgs = {
    objectId: Id<'objects'>;
    notionPageId: string;
    lastOutboundHash: string | null;
    lastInboundEditedTime: string | null;
    archivedAt: number | null;
    lastSyncError: string | null;
    lastSyncedAt: number;
};

type BaseSyncStateOutcome = {
    objectId: Id<'objects'>;
    notionPageId: string;
    notionLastEditedTime: string | null;
};

export type SyncStateSuccessOutcome =
    | (BaseSyncStateOutcome & {kind: 'inboundApplied'})
    | (BaseSyncStateOutcome & {kind: 'inboundEcho'; lastOutboundHash: string | null})
    | (BaseSyncStateOutcome & {kind: 'outboundSynced'; fields: AppSyncFields | NotionPageFields});

export function buildSyncStateArgs(outcome: SyncStateSuccessOutcome, now: number): SyncStateArgs {
    return {
        objectId: outcome.objectId,
        notionPageId: outcome.notionPageId,
        lastOutboundHash: resolveLastOutboundHash(outcome),
        lastInboundEditedTime: outcome.notionLastEditedTime,
        archivedAt: null,
        lastSyncError: null,
        lastSyncedAt: now,
    };
}

export function buildSyncErrorPatch(message: string | null, now: number) {
    return {
        lastSyncError: message,
        lastSyncedAt: now,
    };
}

export function needsSyncStateWrite(
    existing: Doc<'objectNotionSync'> | null | undefined,
    next: SyncStateArgs,
) {
    if (!existing) {
        return true;
    }

    return (
        existing.notionPageId !== next.notionPageId ||
        existing.lastOutboundHash !== next.lastOutboundHash ||
        existing.lastInboundEditedTime !== next.lastInboundEditedTime ||
        existing.archivedAt !== next.archivedAt ||
        existing.lastSyncError !== next.lastSyncError
    );
}

export function needsSyncErrorPatchWrite(
    existing: Doc<'objectNotionSync'>,
    message: string | null,
) {
    return existing.lastSyncError !== message;
}

export const getSyncRecordByPageId = internalQuery({
    args: {
        notionPageId: v.string(),
    },
    handler: async (ctx, {notionPageId}) => {
        return await ctx.db
            .query('objectNotionSync')
            .withIndex('byNotionPageId', q => q.eq('notionPageId', notionPageId))
            .unique();
    },
});

export async function upsertSyncStateInMutation(ctx: MutationCtx, args: SyncStateArgs) {
    const existing = await ctx.db
        .query('objectNotionSync')
        .withIndex('byObjectId', q => q.eq('objectId', args.objectId))
        .unique();
    if (existing) {
        if (!needsSyncStateWrite(existing, args)) {
            return existing._id;
        }
        await ctx.db.patch('objectNotionSync', existing._id, args);
        return existing._id;
    }
    return await ctx.db.insert('objectNotionSync', args);
}

export const upsertSyncState = internalMutation({
    args: {
        objectId: v.id('objects'),
        notionPageId: v.string(),
        lastOutboundHash: v.union(v.string(), v.null()),
        lastInboundEditedTime: v.union(v.string(), v.null()),
        archivedAt: v.union(v.number(), v.null()),
        lastSyncError: v.union(v.string(), v.null()),
        lastSyncedAt: v.number(),
    },
    handler: upsertSyncStateInMutation,
});

export const patchSyncState = internalMutation({
    args: {
        objectId: v.id('objects'),
        message: v.union(v.string(), v.null()),
    },
    handler: async (ctx, {objectId, message}) => {
        const existing = await ctx.db
            .query('objectNotionSync')
            .withIndex('byObjectId', q => q.eq('objectId', objectId))
            .unique();
        if (!existing) {
            return null;
        }
        if (!needsSyncErrorPatchWrite(existing, message)) {
            return existing._id;
        }
        await ctx.db.patch(
            'objectNotionSync',
            existing._id,
            buildSyncErrorPatch(message, Date.now()),
        );
        return existing._id;
    },
});

export async function deleteSyncStateForObject(
    ctx: MutationCtx,
    objectId: Id<'objects'>,
): Promise<Doc<'objectNotionSync'> | null> {
    const existing = await ctx.db
        .query('objectNotionSync')
        .withIndex('byObjectId', q => q.eq('objectId', objectId))
        .unique();
    if (!existing) {
        return null;
    }
    await ctx.db.delete(existing._id);
    return existing;
}

function resolveLastOutboundHash(outcome: SyncStateSuccessOutcome) {
    if (outcome.kind === 'inboundEcho') {
        return outcome.lastOutboundHash;
    }
    if (outcome.kind === 'outboundSynced') {
        return computeSyncHash(outcome.fields);
    }
    return null;
}
