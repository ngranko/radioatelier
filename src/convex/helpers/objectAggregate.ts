import type {Doc, Id} from '../_generated/dataModel';
import type {MutationCtx} from '../_generated/server';
import {removeVisitedForObject} from './objectHelpers';

type MapPointSearchFields = Pick<
    Doc<'mapPoints'>,
    'latitude' | 'longitude' | 'address' | 'city' | 'country'
>;

export function buildObjectSearchRecord(input: {
    id: Id<'objects'>;
    name: string;
    mapPoint: MapPointSearchFields;
    categoryName: string;
    createdBy: Id<'users'>;
    isPublic: boolean;
}) {
    return {
        id: input.id,
        name: input.name,
        address: input.mapPoint.address,
        city: input.mapPoint.city,
        country: input.mapPoint.country,
        categoryName: input.categoryName,
        location: [input.mapPoint.latitude, input.mapPoint.longitude] as [number, number],
        createdBy: input.createdBy,
        isPublic: input.isPublic,
    };
}

export async function deleteObjectAggregate(ctx: MutationCtx, object: Doc<'objects'>) {
    const marker = await ctx.db
        .query('markers')
        .withIndex('byObjectId', q => q.eq('objectId', object._id))
        .first();
    if (marker) {
        await ctx.db.delete('markers', marker._id);
    }

    const privateTagRows = await ctx.db
        .query('objectPrivateTags')
        .withIndex('byObjectIdUserId', q => q.eq('objectId', object._id))
        .collect();
    for (const row of privateTagRows) {
        await ctx.db.delete('objectPrivateTags', row._id);
    }

    await removeVisitedForObject(ctx, object._id);
    await ctx.db.delete('mapPoints', object.mapPointId);
    await ctx.db.delete('objects', object._id);
}
