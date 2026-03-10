import {makeFunctionReference, paginationOptsValidator} from 'convex/server';
import {ConvexError, v} from 'convex/values';
import {action, internalAction} from './_generated/server';
import {typesenseObjectSchema} from './sharedValidators';
import {createTypesenseSyncClient} from './typesense/client';
import {
    addObjectToTypesense,
    removeObjectFromTypesense,
    updateObjectInTypesense,
} from './typesense/objects';

const listForTypesenseBackfill = makeFunctionReference<'query'>('objects:listForTypesenseBackfill');

// only needed for backfilling, should be removed later
export const getBackfillPage = action({
    args: {
        backfillKey: v.string(),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, {backfillKey, paginationOpts}) => {
        const expectedKey = process.env.TYPESENSE_BACKFILL_KEY?.trim();
        if (!expectedKey) {
            throw new ConvexError('Missing TYPESENSE_BACKFILL_KEY environment variable');
        }
        if (backfillKey !== expectedKey) {
            throw new ConvexError('Unauthorized');
        }

        return await ctx.runQuery(listForTypesenseBackfill, {
            paginationOpts,
        });
    },
});

export const createInTypesense = internalAction({
    args: {
        object: typesenseObjectSchema,
    },
    handler: async (ctx, {object}) => {
        const client = createTypesenseSyncClient();
        return await addObjectToTypesense(client, {
            ...object,
            location: object.location as [number, number],
        });
    },
});

export const updateInTypesense = internalAction({
    args: {
        object: typesenseObjectSchema,
    },
    handler: async (ctx, {object}) => {
        const client = createTypesenseSyncClient();
        return await updateObjectInTypesense(client, {
            ...object,
            location: object.location as [number, number],
        });
    },
});

export const removeFromTypesense = internalAction({
    args: {
        objectId: v.id('objects'),
    },
    handler: async (ctx, {objectId}) => {
        const client = createTypesenseSyncClient();
        return await removeObjectFromTypesense(client, objectId);
    },
});
