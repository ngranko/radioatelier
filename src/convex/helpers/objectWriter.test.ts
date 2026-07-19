import {describe, expect, it} from 'vitest';

import type {Id} from '../_generated/dataModel';
import {filterChangedPatch, splitObjectRecordPatch} from './objectWriter';

const categoryId = 'category-1' as Id<'categories'>;
const tagIds = ['tag-1' as Id<'tags'>];
const secondTagId = 'tag-2' as Id<'tags'>;

describe('splitObjectRecordPatch', () => {
    it('routes fields to the records that store them', () => {
        const {objectPatch, mapPointPatch, markerPatch} = splitObjectRecordPatch({
            name: 'Mosaic',
            categoryId,
            tagIds,
            isRemoved: true,
            isPublic: false,
            latitude: 55.75,
            longitude: 37.61,
            address: 'Tverskaya 1',
        });

        expect(objectPatch).toEqual({
            name: 'Mosaic',
            categoryId,
            tagIds,
            isRemoved: true,
            isPublic: false,
        });
        expect(mapPointPatch).toEqual({
            latitude: 55.75,
            longitude: 37.61,
            address: 'Tverskaya 1',
        });
        expect(markerPatch).toEqual({
            latitude: 55.75,
            longitude: 37.61,
            categoryId,
            tagIds,
            isRemoved: true,
            isPublic: false,
        });
    });

    it('omits absent fields so untouched values stay untouched', () => {
        const {objectPatch, mapPointPatch, markerPatch} = splitObjectRecordPatch({
            name: 'Plaque',
        });

        expect(objectPatch).toEqual({name: 'Plaque'});
        expect(mapPointPatch).toEqual({});
        expect(markerPatch).toEqual({});
    });

    it('keeps explicit nulls as writes', () => {
        const {objectPatch} = splitObjectRecordPatch({
            description: null,
            source: null,
        });

        expect(objectPatch).toEqual({description: null, source: null});
    });

    it('does not leak sync-invisible fields to the marker', () => {
        const {markerPatch} = splitObjectRecordPatch({
            name: 'Sign',
            description: 'painted',
            source: 'https://example.com',
        });

        expect(markerPatch).toEqual({});
    });
});

describe('filterChangedPatch', () => {
    it('removes unchanged scalar fields', () => {
        const patch = filterChangedPatch(
            {name: 'Mosaic', isRemoved: false},
            {name: 'Mosaic', isRemoved: true},
        );

        expect(patch).toEqual({isRemoved: true});
    });

    it('treats tag order as unchanged', () => {
        const patch = filterChangedPatch(
            {tagIds: [tagIds[0], secondTagId]},
            {tagIds: [secondTagId, tagIds[0]]},
        );

        expect(patch).toEqual({});
    });

    it('keeps changed tag sets', () => {
        const patch = filterChangedPatch({tagIds}, {tagIds: [tagIds[0], secondTagId]});

        expect(patch).toEqual({tagIds: [tagIds[0], secondTagId]});
    });

    it('returns an empty patch when no values changed', () => {
        const patch = filterChangedPatch(
            {latitude: 55.75, longitude: 37.61},
            {
                latitude: 55.75,
                longitude: 37.61,
            },
        );

        expect(patch).toEqual({});
    });
});
