import type {SearchResultsPage} from '$lib/interfaces/object';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {createHarness, createPage, request} from './searchResultsTestHelpers';

afterEach(() => vi.restoreAllMocks());

describe('search results lifetime', () => {
    it('clears old pins and captures the area only after successful results are fitted', async () => {
        const {results, local, google, map, events} = createHarness();
        const response = Promise.withResolvers<SearchResultsPage>();
        local.mockReturnValueOnce(response.promise);
        const pending = results.startSearch(request);

        expect(results.pages.local.isLoading).toBe(true);
        expect(events).toEqual(['clear']);
        expect(google).not.toHaveBeenCalled();
        response.resolve(createPage('first'));
        await pending;

        expect(events).toEqual(['clear', 'pins', 'fit', 'area']);
        expect(map.fit).toHaveBeenCalledWith(createPage('first').items, request);
        expect(results.pages.local).toMatchObject({hasLoaded: true, isLoading: false});
    });

    it('keeps cached source pages, but resets both caches for a new search area', async () => {
        const {results, local, google} = createHarness();
        await results.startSearch(request);
        await results.activateSource('google');
        await results.activateSource('local');
        await results.activateSource('google');
        expect(local).toHaveBeenCalledTimes(1);
        expect(google).toHaveBeenCalledTimes(1);

        await results.startSearch({...request, latitude: 56});
        expect(results.activeSource).toBe('google');
        expect(google).toHaveBeenCalledTimes(2);
        expect(results.pages.local.hasLoaded).toBe(false);
        await results.startSearch({...request, query: 'plaque'});
        expect(results.activeSource).toBe('local');
        expect(results.pages.google.hasLoaded).toBe(false);
        expect(local).toHaveBeenCalledTimes(2);
    });

    it('caches inactive responses without changing the active pins or camera', async () => {
        const {results, local, map, events} = createHarness();
        const response = Promise.withResolvers<SearchResultsPage>();
        local.mockReturnValueOnce(response.promise);
        const pending = results.startSearch(request);
        await results.activateSource('google');
        events.length = 0;

        response.resolve(createPage('late local'));
        await pending;
        expect(events).toEqual([]);
        expect(results.pages.local.items).toEqual(createPage('late local').items);

        await results.activateSource('local');
        expect(local).toHaveBeenCalledTimes(1);
        expect(events).toEqual(['pins', 'fit', 'area']);
        expect(map.publishPins).toHaveBeenLastCalledWith(createPage('late local').items);
    });

    it.each(['success', 'failure'])(
        'ignores superseded %s without settling the current request',
        async outcome => {
            const {results, local, events} = createHarness();
            const earlier = Promise.withResolvers<SearchResultsPage>();
            const current = Promise.withResolvers<SearchResultsPage>();
            local.mockReturnValueOnce(earlier.promise).mockReturnValueOnce(current.promise);
            const oldLoad = results.startSearch(request);
            const newLoad = results.startSearch({...request, query: 'plaque'});
            events.length = 0;
            if (outcome === 'success') {
                earlier.resolve(createPage('stale'));
            } else {
                earlier.reject(new Error('stale failure'));
            }
            await oldLoad;

            expect(events).toEqual([]);
            expect(results.pages.local).toMatchObject({items: [], isLoading: true, isError: false});
            current.resolve(createPage('current'));
            await newLoad;
            expect(results.pages.local.items).toEqual(createPage('current').items);
        },
    );

    it('retries only a failed active source, leaving Google untouched', async () => {
        const {results, local, google} = createHarness();
        vi.spyOn(console, 'error').mockImplementation(() => {});
        local.mockRejectedValueOnce(new Error('offline'));
        await results.startSearch(request);
        expect(results.pages.local.isError).toBe(true);

        await results.retry();
        await results.retry();

        expect(local).toHaveBeenCalledTimes(2);
        expect(google).not.toHaveBeenCalled();
        expect(results.pages.local).toMatchObject({isError: false, hasLoaded: true});
    });

    it('ignores completions and commands after disposal', async () => {
        const {results, local, events} = createHarness();
        const response = Promise.withResolvers<SearchResultsPage>();
        local.mockReturnValueOnce(response.promise);
        const pending = results.startSearch(request);
        results.dispose();
        events.length = 0;
        response.resolve(createPage('late'));
        await pending;
        await results.startSearch(request);
        await results.activateSource('google');
        await results.loadMore();

        expect(events).toEqual([]);
        expect(local).toHaveBeenCalledTimes(1);
        expect(results.pages.local.items).toEqual([]);
    });
});
