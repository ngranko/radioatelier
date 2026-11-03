import type {ConvexClient} from 'convex/browser';
import {getFunctionName} from 'convex/server';
import {describe, expect, it, vi} from 'vitest';
import {createSearchResults} from './searchResults.svelte';
import {createSearchSources} from './searchResultsAdapters';
import {createHarness, request} from './searchResultsTestHelpers';

describe('search source adapters', () => {
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
