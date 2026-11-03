import type {SearchItem, SearchPageSource, SearchResultsPage} from '$lib/interfaces/object';
import {vi} from 'vitest';
import {createSearchResults} from './searchResults.svelte';

export const request = {query: 'mosaic', latitude: 55.75, longitude: 37.61};

export function createPage(name: string, nextCursor = ''): SearchResultsPage {
    const item: SearchItem = {
        id: null,
        name,
        categoryName: '',
        latitude: 55.75,
        longitude: 37.61,
        address: null,
        city: null,
        country: null,
        type: 'google',
        googlePlaceId: name,
    };
    return {items: [item], hasMore: Boolean(nextCursor), nextCursor};
}

export function createHarness() {
    const local = vi.fn<SearchPageSource>().mockResolvedValue(createPage('local'));
    const google = vi.fn<SearchPageSource>().mockResolvedValue(createPage('google'));
    const events: string[] = [];
    const map = {
        clear: vi.fn(() => {
            events.push('clear');
        }),
        publishPins: vi.fn(() => {
            events.push('pins');
        }),
        fit: vi.fn(() => {
            events.push('fit');
        }),
        rememberArea: vi.fn(() => {
            events.push('area');
        }),
    };
    return {
        results: createSearchResults(() => ({local, google}), map),
        local,
        google,
        map,
        events,
    };
}
