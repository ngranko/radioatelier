import {v} from 'convex/values';
import {internal} from '../_generated/api';
import type {Doc} from '../_generated/dataModel';
import {internalAction, type ActionCtx} from '../_generated/server';
import {geocodeAddress} from '../helpers/geocode';
import {retrievePage} from '../notion/client';
import {belongsToConfiguredDataSource} from '../notion/config';
import {readNotionPageFields} from '../notion/fields';
import {getNotionPageOwnerId} from './identity';
import {decideInboundSync, type InboundSyncDecision} from './inboundDecision';
import type {ObjectSyncSnapshot} from './snapshot';
import {buildSyncStateArgs, needsSyncStateWrite} from './state';

type InboundExecution = {
    decision: InboundSyncDecision;
    input: {
        pageId: string;
        notionOwnerId: string | null;
        lastInboundEditedTime: string | null;
    };
};

export const processWebhookEvent = internalAction({
    args: {
        pageId: v.string(),
        eventType: v.string(),
    },
    handler: async (ctx, {pageId, eventType}) => {
        return await performInboundSync(ctx, {pageId, eventType});
    },
});

export async function performInboundSync(
    ctx: ActionCtx,
    {pageId, eventType}: {pageId: string; eventType: string},
) {
    const existingSync = (await ctx.runQuery(internal.notionSync.state.getSyncRecordByPageId, {
        notionPageId: pageId,
    })) as Doc<'objectNotionSync'> | null;
    const execution = await loadInboundExecution(ctx, {
        pageId,
        eventType,
        existingSync,
    });
    if (!execution) {
        return null;
    }
    return await executeInboundDecision(ctx, execution.decision, execution.input, existingSync);
}

async function loadInboundExecution(
    ctx: ActionCtx,
    input: {
        pageId: string;
        eventType: string;
        existingSync: Doc<'objectNotionSync'> | null;
    },
): Promise<InboundExecution | null> {
    if (input.eventType === 'page.deleted') {
        return buildRemovedExecution(input, null);
    }

    const notionPage = await retrievePage(input.pageId);
    if (!belongsToConfiguredDataSource(notionPage)) {
        return null;
    }

    const pageState =
        notionPage.in_trash || notionPage.archived || notionPage.is_archived ? 'removed' : 'active';
    const notionFields = readNotionPageFields(notionPage);
    const {existingSnapshot} = await loadDecisionContext(ctx, input.existingSync, pageState);
    const decision = decideInboundSync({
        eventType: input.eventType,
        pageState,
        existingSync: input.existingSync,
        notionFields,
        existingSnapshot,
    });
    return {
        decision,
        input: {
            pageId: input.pageId,
            notionOwnerId: getNotionPageOwnerId(notionPage),
            lastInboundEditedTime: notionPage.last_edited_time ?? null,
        },
    };
}

function buildRemovedExecution(
    input: {
        pageId: string;
        eventType: string;
        existingSync: Doc<'objectNotionSync'> | null;
    },
    lastInboundEditedTime: string | null,
): InboundExecution {
    return {
        decision: decideInboundSync({
            eventType: input.eventType,
            pageState: 'removed',
            existingSync: input.existingSync,
            notionFields: null,
            existingSnapshot: null,
        }),
        input: {
            pageId: input.pageId,
            notionOwnerId: null,
            lastInboundEditedTime,
        },
    };
}

async function loadDecisionContext(
    ctx: ActionCtx,
    existingSync: Doc<'objectNotionSync'> | null,
    pageState: 'active' | 'removed',
) {
    if (pageState !== 'active' || !existingSync) {
        return {existingSnapshot: null};
    }
    return {
        existingSnapshot: (await ctx.runQuery(internal.notionSync.snapshot.getObjectSnapshot, {
            objectId: existingSync.objectId,
        })) as ObjectSyncSnapshot | null,
    };
}

async function executeInboundDecision(
    ctx: ActionCtx,
    decision: InboundSyncDecision,
    input: {
        pageId: string;
        notionOwnerId: string | null;
        lastInboundEditedTime: string | null;
    },
    existingSync: Doc<'objectNotionSync'> | null,
) {
    switch (decision.kind) {
        case 'skip':
            return null;
        case 'deleteObject':
            await ctx.runMutation(internal.objectsSync.deleteObjectFromSync, {
                objectId: decision.objectId,
            });
            return null;
        case 'recordEcho': {
            const syncStateArgs = buildSyncStateArgs(
                {
                    kind: 'inboundEcho',
                    objectId: decision.objectId,
                    notionPageId: input.pageId,
                    lastOutboundHash: decision.lastOutboundHash,
                    notionLastEditedTime: input.lastInboundEditedTime,
                },
                Date.now(),
            );
            if (!needsSyncStateWrite(existingSync, syncStateArgs)) {
                return null;
            }
            await ctx.runMutation(internal.notionSync.state.upsertSyncState, syncStateArgs);
            return null;
        }
        case 'patchObject':
            await ctx.runMutation(internal.objectsSync.patchObjectFromSync, {
                objectId: decision.objectId,
                notionPageId: input.pageId,
                patch: decision.patch,
                lastInboundEditedTime: input.lastInboundEditedTime,
            });
            return null;
        case 'createObject': {
            const owner = (await ctx.runQuery(internal.notionSync.identity.resolveObjectOwner, {
                notionUserId: input.notionOwnerId,
            })) as Doc<'users'> | null;
            if (!owner) {
                return null;
            }
            const coordinates = await geocodeAddress(decision.fields);
            if (!coordinates) {
                console.warn(`[Notion sync] Unable to geocode page ${input.pageId}`);
                return null;
            }
            await ctx.runMutation(internal.objectsSync.createObjectFromSync, {
                notionPageId: input.pageId,
                ownerId: owner._id,
                latitude: coordinates.latitude,
                longitude: coordinates.longitude,
                fields: decision.fields,
                lastInboundEditedTime: input.lastInboundEditedTime,
            });
            return null;
        }
    }
}
