import {describe, expect, it} from 'vitest';
import type {Doc, Id} from '../_generated/dataModel';
import {buildObjectDetails} from './objectDetails';
import type {ObjectAggregate} from './objectReader';

const ownerId = 'user-1' as Id<'users'>;
type ObjectViewerContext = Parameters<typeof buildObjectDetails>[1];

const aggregate: ObjectAggregate = {
    object: {
        _id: 'object-1',
        name: 'Mosaic',
        description: 'painted',
        installedPeriod: '1950s',
        isRemoved: false,
        removalPeriod: null,
        source: null,
        coverId: null,
        categoryId: 'category-1',
        isPublic: true,
        tagIds: ['tag-1'],
        mapPointId: 'map-1',
        createdById: ownerId,
        internalId: 'RA-7',
    } as unknown as Doc<'objects'>,
    mapPoint: {
        _id: 'map-1',
        latitude: 55.75,
        longitude: 37.61,
        address: 'Tverskaya 1',
        city: 'Moscow',
        country: 'Russia',
    } as Doc<'mapPoints'>,
    category: {_id: 'category-1', name: 'mosaics'} as Doc<'categories'>,
    tags: [{_id: 'tag-1', name: 'sound'} as Doc<'tags'>],
};

function makeViewer(overrides: Partial<ObjectViewerContext> = {}): ObjectViewerContext {
    return {
        userId: ownerId,
        privateTags: [],
        isVisited: false,
        cover: null,
        ...overrides,
    };
}

describe('buildObjectDetails', () => {
    it('projects the aggregate for the owner', () => {
        const details = buildObjectDetails(
            aggregate,
            makeViewer({
                privateTags: [{_id: 'private-1', name: 'to fix'} as Doc<'privateTags'>],
                isVisited: true,
            }),
        );

        expect(details).toMatchObject({
            id: 'object-1',
            name: 'Mosaic',
            latitude: 55.75,
            longitude: 37.61,
            address: 'Tverskaya 1',
            category: {id: 'category-1', name: 'mosaics'},
            tags: [{id: 'tag-1', name: 'sound'}],
            privateTags: [{id: 'private-1', name: 'to fix'}],
            isVisited: true,
            isOwner: true,
            internalId: 'RA-7',
        });
    });

    it.each([
        {viewer: 'anonymous', userId: null, internalId: null},
        {viewer: 'signed-in non-owner', userId: 'user-2' as Id<'users'>, internalId: 'RA-7'},
    ])('projects ownership fields for an $viewer viewer', ({userId, internalId}) => {
        const details = buildObjectDetails(aggregate, makeViewer({userId}));

        expect(details.isOwner).toBe(false);
        expect(details.internalId).toBe(internalId);
    });
});
