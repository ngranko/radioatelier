import {paginationOptsValidator} from 'convex/server';
import {v} from 'convex/values';
import type {Doc, Id} from '../_generated/dataModel';
import {internalQuery, type QueryCtx} from '../_generated/server';
import {
    loadObjectAggregate,
    loadObjectAggregates,
    type ObjectAggregate,
} from '../helpers/objectReader';
import {getNotionSyncAppUrl} from '../notion/config';
import {loadSyncSnapshotExtras} from './snapshotExtras';
import type {AppSyncFields} from './types';

export type ObjectSyncSnapshot = {
    objectId: Id<'objects'>;
    owner: {
        _id: Id<'users'>;
        notionSyncEnabled: boolean;
    };
    sync: Doc<'objectNotionSync'> | null;
    fields: AppSyncFields;
};

export type ObjectSyncSnapshotPage = {
    page: ObjectSyncSnapshot[];
    isDone: boolean;
    continueCursor: string;
};

export const getObjectSnapshot = internalQuery({
    args: {
        objectId: v.id('objects'),
    },
    handler: async (ctx, {objectId}): Promise<ObjectSyncSnapshot | null> => {
        const object = await ctx.db.get('objects', objectId);
        if (!object) {
            return null;
        }
        return await loadObjectSnapshot(ctx, object);
    },
});

export const listEligibleOwnerPage = internalQuery({
    args: {
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, {paginationOpts}) => {
        const result = await ctx.db
            .query('users')
            .withIndex('byNotionSyncEnabled', q => q.eq('notionSyncEnabled', true))
            .paginate(paginationOpts);
        return {
            ...result,
            page: result.page.filter(owner => !owner.isDeleted),
        };
    },
});

export const listEligibleObjectSnapshotPage = internalQuery({
    args: {
        ownerId: v.id('users'),
        paginationOpts: paginationOptsValidator,
    },
    handler: async (ctx, {ownerId, paginationOpts}): Promise<ObjectSyncSnapshotPage> => {
        const owner = await ctx.db.get('users', ownerId);
        if (!owner || owner.isDeleted || !owner.notionSyncEnabled) {
            return {
                page: [],
                isDone: true,
                continueCursor: paginationOpts.cursor ?? '',
            };
        }

        const result = await ctx.db
            .query('objects')
            .withIndex('byCreatedById', q => q.eq('createdById', owner._id))
            .paginate(paginationOpts);
        const [aggregates, extras] = await Promise.all([
            loadObjectAggregates(ctx, result.page),
            loadSyncSnapshotExtras(ctx, result.page),
        ]);
        return {
            ...result,
            page: result.page
                .map(object => {
                    const aggregate = aggregates.get(object._id);
                    if (!aggregate) {
                        return null;
                    }
                    return assembleObjectSnapshot(aggregate, {
                        owner,
                        sync: extras.syncByObjectId.get(object._id) ?? null,
                        isVisited: extras.visitedByObjectId.get(object._id) ?? false,
                    });
                })
                .filter((snapshot): snapshot is ObjectSyncSnapshot => snapshot !== null),
        };
    },
});

export function assembleObjectSnapshot(
    aggregate: ObjectAggregate,
    extras: {
        owner: Doc<'users'>;
        sync: Doc<'objectNotionSync'> | null;
        isVisited: boolean;
    },
): ObjectSyncSnapshot {
    const {object} = aggregate;
    return {
        objectId: object._id,
        owner: {
            _id: extras.owner._id,
            notionSyncEnabled: extras.owner.notionSyncEnabled ?? false,
        },
        sync: extras.sync,
        fields: buildAppFields(aggregate, extras.isVisited),
    };
}

async function loadObjectSnapshot(
    ctx: QueryCtx,
    object: Doc<'objects'>,
): Promise<ObjectSyncSnapshot | null> {
    const [owner, aggregate, extras] = await Promise.all([
        ctx.db.get('users', object.createdById),
        loadObjectAggregate(ctx, object),
        loadSyncSnapshotExtras(ctx, [object]),
    ]);
    if (!owner || !aggregate) {
        return null;
    }
    return assembleObjectSnapshot(aggregate, {
        owner,
        sync: extras.syncByObjectId.get(object._id) ?? null,
        isVisited: extras.visitedByObjectId.get(object._id) ?? false,
    });
}

function buildAppFields(aggregate: ObjectAggregate, isVisited: boolean): AppSyncFields {
    const {object, mapPoint, category, tags} = aggregate;
    return {
        name: object.name,
        categoryName: category.name,
        address: mapPoint.address,
        city: mapPoint.city,
        country: mapPoint.country,
        mapLink: buildObjectUrl(getNotionSyncAppUrl(), object._id),
        internalId: object.internalId,
        installedPeriod: object.installedPeriod,
        isRemoved: object.isRemoved,
        removalPeriod: object.removalPeriod,
        tagNames: tags.map(tag => tag.name),
        isVisited,
        source: object.source,
    };
}

function buildObjectUrl(baseUrl: string, objectId: string) {
    return new URL(`/object/${objectId}`, ensureTrailingSlash(baseUrl)).toString();
}

function ensureTrailingSlash(value: string) {
    return value.endsWith('/') ? value : `${value}/`;
}
