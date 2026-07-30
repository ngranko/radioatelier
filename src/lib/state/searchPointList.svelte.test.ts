import type {Id} from '$convex/_generated/dataModel';
import type {SearchItem} from '$lib/interfaces/object';
import {beforeEach, describe, expect, it} from 'vitest';
import {
    clearSearchPointList,
    clearSelectedSearchPoint,
    hasSearchPointAt,
    removeSearchPointsAt,
    replaceSearchPointList,
    searchPointList,
    selectSearchPoint,
} from './searchPointList.svelte.ts';

function makeItem(overrides: Partial<SearchItem> = {}): SearchItem {
    return {
        id: null,
        name: 'Place',
        categoryName: '',
        latitude: 55.75,
        longitude: 37.61,
        address: null,
        city: null,
        country: null,
        type: 'google',
        googlePlaceId: 'place-1',
        ...overrides,
    };
}

describe('searchPointList', () => {
    beforeEach(() => {
        clearSearchPointList();
    });

    it('keeps a single pin when points are selected one after another', () => {
        selectSearchPoint({object: makeItem()});
        selectSearchPoint({object: makeItem({googlePlaceId: 'place-2', latitude: 56})});

        expect(Object.keys(searchPointList)).toEqual(['place-2']);
    });

    it('keys placeless points by position so reselecting them reuses the pin', () => {
        const item = makeItem({googlePlaceId: null, type: 'local'});

        const first = selectSearchPoint({object: item});
        const second = selectSearchPoint({object: item});

        expect(first).toBe(second);
        expect(Object.keys(searchPointList)).toEqual(['55.75,37.61']);
    });

    it('drops the selected pin without touching the result list pins', () => {
        replaceSearchPointList([{object: makeItem()}]);

        clearSelectedSearchPoint();

        expect(Object.keys(searchPointList)).toEqual(['place-1']);
    });

    it('leaves a result list pin alone when the next point is selected', () => {
        replaceSearchPointList([{object: makeItem()}]);

        selectSearchPoint({object: makeItem()});
        selectSearchPoint({object: makeItem({googlePlaceId: 'place-2', latitude: 56})});

        expect(Object.keys(searchPointList)).toEqual(['place-1', 'place-2']);
    });

    it('removes a pin by position no matter how the point was opened', () => {
        replaceSearchPointList([
            {object: makeItem()},
            {object: makeItem({googlePlaceId: 'place-2', latitude: 56})},
        ]);

        removeSearchPointsAt({lat: 55.75, lng: 37.61});

        expect(Object.keys(searchPointList)).toEqual(['place-2']);
    });

    it('reports a search point sitting at a draft position', () => {
        selectSearchPoint({object: makeItem()});

        expect(hasSearchPointAt({lat: 55.75, lng: 37.61})).toBe(true);
        expect(hasSearchPointAt({lat: 55.75, lng: 37.62})).toBe(false);
    });

    it('forgets the selection once the list is replaced', () => {
        selectSearchPoint({object: makeItem()});
        replaceSearchPointList([{object: makeItem({id: 'object-1' as Id<'objects'>})}]);

        clearSelectedSearchPoint();

        expect(Object.keys(searchPointList)).toEqual(['object-1']);
    });
});
