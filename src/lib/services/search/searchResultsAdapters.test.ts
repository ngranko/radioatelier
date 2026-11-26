import type {MapProvider} from '$lib/interfaces/map';
import {mapState} from '$lib/state/map.svelte';
import {
    closeDetailsOverlay,
    showLoadingDetailsOverlay,
} from '$lib/state/objectDetailsOverlay.svelte';
import {searchArea} from '$lib/state/searchArea.svelte';
import type {ConvexClient} from 'convex/browser';
import {getFunctionName} from 'convex/server';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {createSearchResults} from './searchResults.svelte';
import {createSearchSources, searchResultsMap} from './searchResultsAdapters';
import {createHarness, createPage, request} from './searchResultsTestHelpers';

beforeEach(() => {
    closeDetailsOverlay();
    mapState.isReady = false;
    mapState.provider = null;
    searchArea.searched = searchArea.current = null;
    vi.clearAllMocks();
});
afterEach(() => vi.unstubAllGlobals());

describe('search source adapters', () => {
    it('accepts a late page without moving the selected details camera or its area baseline', async () => {
        const map = {
            fitBounds: vi.fn(),
            setCenter: vi.fn(),
            createBounds: () => ({extend: vi.fn()}),
            getCenter: () => ({lat: 10, lng: 20}),
            getBounds: () => ({toRect: () => ({north: 11, south: 9, east: 21, west: 19})}),
        };
        mapState.provider = map as unknown as MapProvider;
        mapState.isReady = true;
        vi.stubGlobal('document', {body: {clientWidth: 1000}});
        const response = Promise.withResolvers<ReturnType<typeof createPage>>();
        const results = createSearchResults(
            () => ({local: () => response.promise, google: async () => createPage('google')}),
            searchResultsMap,
        );
        const pending = results.startSearch(request);
        showLoadingDetailsOverlay('object-1', {latitude: 10, longitude: 20});

        response.resolve(createPage('late'));
        await pending;

        expect(results.pages.local.items).toEqual(createPage('late').items);
        expect(map.fitBounds).not.toHaveBeenCalled();
        expect(map.setCenter).not.toHaveBeenCalled();
        expect(searchArea.searched).toBeNull();
    });

    it('keeps each search snapshot while translating independent offsets and page tokens', async () => {
        const action = vi
            .fn<ConvexClient['action']>()
            .mockResolvedValueOnce({items: [], hasMore: true, offset: 20})
            .mockResolvedValueOnce({items: [], hasMore: false, offset: 40})
            .mockResolvedValueOnce({items: [], hasMore: true, nextPageToken: 'google-next'})
            .mockResolvedValueOnce({items: [], hasMore: false, nextPageToken: ''});
        const {map} = createHarness();
        const results = createSearchResults(query => createSearchSources({action}, query), map);
        const query = {...request};
        await results.startSearch(query);
        query.latitude = 0;
        await results.loadMore();
        await results.activateSource('google');
        await results.loadMore();

        expect(action.mock.calls.map(([ref]) => getFunctionName(ref))).toEqual([
            'search:local',
            'search:local',
            'search:google',
            'search:google',
        ]);
        expect(action.mock.calls.map(([, args]) => args)).toEqual([
            {...request, offset: 0},
            {...request, offset: 20},
            {...request, pageToken: ''},
            {...request, pageToken: 'google-next'},
        ]);
    });
});
