import {goto} from '$app/navigation';
import {page} from '$app/state';
import type {Id} from '$convex/_generated/dataModel';
import {
    enterEditMode,
    objectDetailsOverlay,
    setOverlayPosition,
    showObjectDetailsOverlay,
} from '$lib/state/objectDetailsOverlay.svelte';
import {
    replaceSearchPointList,
    searchPointList,
    selectSearchPoint,
} from '$lib/state/searchPointList.svelte';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
    closeObjectSelection,
    focusObjectSelection,
    selectObject,
    selectSearchResult,
} from './objectSelection';
import {
    createSearchItem,
    holdSelection,
    prepareMap,
    resetSelection,
} from './objectSelectionTestHelpers';

vi.mock('$app/navigation', () => ({goto: vi.fn().mockResolvedValue(undefined)}));
vi.mock('$app/state', () => ({page: {params: {id: undefined}}}));

beforeEach(resetSelection);
afterEach(() => vi.unstubAllGlobals());

describe('Object selection', () => {
    it('opens an archive result without a map or registered Marker', () => {
        const item = createSearchItem({id: 'object-1' as Id<'objects'>});

        selectSearchResult(item);

        expect(goto).toHaveBeenCalledWith('/object/object-1');
        expect(objectDetailsOverlay).toMatchObject({
            isOpen: true,
            isLoading: true,
            detailsId: item.id,
        });
    });

    it.each(['place-1', null])('opens the chosen point result, placeId=%s', googlePlaceId => {
        const item = createSearchItem({googlePlaceId});
        selectSearchResult(item);

        const destination = new URL(vi.mocked(goto).mock.calls[0][0], 'https://archive.test');
        expect(destination.pathname).toBe('/point');
        expect(Object.fromEntries(destination.searchParams)).toEqual({
            lat: '55.75',
            lng: '37.61',
            ...(googlePlaceId ? {placeId: googlePlaceId} : {}),
        });
        expect(searchPointList[objectDetailsOverlay.detailsId]?.object).toEqual(item);
    });

    it('preserves edits, selection, pins and camera until a switch is accepted', () => {
        const map = prepareMap();
        showObjectDetailsOverlay('object-1', {id: 'object-1', name: 'Keep edits'} as never);
        enterEditMode();
        setOverlayPosition('peek');
        const previousPoint = createSearchItem();
        selectSearchPoint({object: previousPoint});
        const accept = holdSelection();

        selectObject('object-2' as Id<'objects'>, {latitude: 10, longitude: 20});

        expect(objectDetailsOverlay).toMatchObject({detailsId: 'object-1', mode: 'objectEdit'});
        expect(Object.values(searchPointList)).toEqual([{object: previousPoint}]);
        expect(map.setCenter).not.toHaveBeenCalled();
        expect(goto).not.toHaveBeenCalled();

        accept();

        expect(objectDetailsOverlay).toMatchObject({detailsId: 'object-2', position: 'peek'});
        expect(Object.keys(searchPointList)).toEqual([]);
        expect(map.setCenter).toHaveBeenCalled();
        expect(goto).toHaveBeenCalledWith('/object/object-2');
    });

    it('leaves same-target edits and sheet position untouched', () => {
        showObjectDetailsOverlay('object-1', {id: 'object-1', name: 'Keep edits'} as never);
        enterEditMode();
        setOverlayPosition('minimized');
        holdSelection();

        selectObject('object-1' as Id<'objects'>, {latitude: 10, longitude: 20});

        expect(objectDetailsOverlay).toMatchObject({
            mode: 'objectEdit',
            position: 'minimized',
            details: {id: 'object-1', name: 'Keep edits'},
        });
        expect(goto).not.toHaveBeenCalled();
    });

    it('focuses the saved selection when the map later becomes ready', () => {
        selectSearchResult(createSearchItem());
        const map = prepareMap();

        focusObjectSelection();

        expect(map.setCenter).toHaveBeenCalledWith(55.75, 37.61);
    });

    it('keeps result-list pins when their preview is closed', () => {
        const item = createSearchItem();
        replaceSearchPointList([{object: item}]);
        selectSearchResult(item);

        closeObjectSelection();

        expect(objectDetailsOverlay.isOpen).toBe(false);
        expect(Object.values(searchPointList)).toEqual([{object: item}]);
    });

    it('removes a preview-owned pin when its preview is closed', () => {
        selectSearchResult(createSearchItem());

        closeObjectSelection();

        expect(Object.keys(searchPointList)).toEqual([]);
    });

    it('reopens an anonymous shared Object without navigating or losing its values', () => {
        page.params.id = 'object-1';
        showObjectDetailsOverlay('object-1', {id: 'object-1', name: 'Shared'} as never);
        closeObjectSelection(true);

        selectObject('object-1' as Id<'objects'>, {latitude: 10, longitude: 20});

        expect(objectDetailsOverlay).toMatchObject({isOpen: true, details: {name: 'Shared'}});
        expect(goto).not.toHaveBeenCalled();
    });
});
