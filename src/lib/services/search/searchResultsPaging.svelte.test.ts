import type {SearchResultsPage} from '$lib/interfaces/object';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createHarness, createPage, request} from './searchResultsTestHelpers';

afterEach(() => vi.restoreAllMocks());

describe('search results paging', () => {
    it('settles first-page failures and retries only when the source is reactivated', async () => {
        const {results, local, events} = createHarness();
        local.mockRejectedValueOnce(new Error('unavailable'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        await results.startSearch(request);
        await results.activateSource('local');
        await results.loadMore();

        expect(local).toHaveBeenCalledTimes(1);
        expect(events).toEqual(['clear']);
        expect(results.pages.local).toMatchObject({
            isError: true,
            isLoading: false,
            hasLoaded: false,
        });
        await results.activateSource('google');
        await results.activateSource('local');
        expect(local).toHaveBeenCalledTimes(2);
        expect(results.pages.local).toMatchObject({isError: false, hasLoaded: true});
    });

    it('keeps items and the opaque cursor after append failure, then retries that page', async () => {
        const {results, local, events} = createHarness();
        local
            .mockResolvedValueOnce(createPage('first', 'next-token'))
            .mockRejectedValueOnce(new Error('unavailable'))
            .mockResolvedValueOnce(createPage('second'));
        vi.spyOn(console, 'error').mockImplementation(() => {});
        await results.startSearch(request);
        events.length = 0;
        await results.loadMore();

        expect(results.pages.local.items).toEqual(createPage('first').items);
        expect(results.pages.local).toMatchObject({
            isAppendError: true,
            hasMore: true,
            isLoadingMore: false,
        });
        expect(events).toEqual([]);
        await results.loadMore();
        expect(local.mock.calls.map(([cursor]) => cursor)).toEqual([
            '',
            'next-token',
            'next-token',
        ]);
        expect(results.pages.local.items.map(item => item.name)).toEqual(['first', 'second']);
        expect(events).toEqual(['pins', 'fit', 'area']);
        expect(results.pages.local.isAppendError).toBe(false);
    });

    it('retains independent source cursors and ignores concurrent or exhausted load-more commands', async () => {
        const {results, local, google} = createHarness();
        const response = Promise.withResolvers<SearchResultsPage>();
        local
            .mockResolvedValueOnce(createPage('first', 'local-next'))
            .mockReturnValueOnce(response.promise);
        google.mockResolvedValueOnce(createPage('google', 'google-next'));
        await results.startSearch(request);
        const append = results.loadMore();
        await results.loadMore();
        await results.activateSource('google');
        await results.loadMore();
        response.resolve(createPage('last local'));
        await append;
        await results.activateSource('local');
        await results.loadMore();

        expect(local.mock.calls.map(([cursor]) => cursor)).toEqual(['', 'local-next']);
        expect(google.mock.calls.map(([cursor]) => cursor)).toEqual(['', 'google-next']);
        expect(results.pages.local.items.map(item => item.name)).toEqual(['first', 'last local']);
    });

    it('records successful empty results as the searched area', async () => {
        const {results, local, map, events} = createHarness();
        local.mockResolvedValueOnce({items: [], hasMore: false, nextCursor: ''});
        await results.startSearch(request);

        expect(results.pages.local).toMatchObject({items: [], hasLoaded: true, isError: false});
        expect(map.fit).toHaveBeenCalledWith([], request);
        expect(events).toEqual(['clear', 'pins', 'fit', 'area']);
    });
});
