import {api} from '$convex/_generated/api';
import {fitMarkerList} from '$lib/services/map/map.svelte';
import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
import {forgetSearchedArea, rememberSearchedArea} from '$lib/state/searchArea.svelte';
import {clearSearchPointList, replaceSearchPointList} from '$lib/state/searchPointList.svelte';
import type {ConvexClient} from 'convex/browser';
import type {SearchRequest, SearchResultsMap, SearchSources} from './searchResults.svelte';

export function createSearchSources(
    client: Pick<ConvexClient, 'action'>,
    request: SearchRequest,
): SearchSources {
    return {
        local: async cursor => {
            const page = await client.action(api.search.local, {
                ...request,
                offset: Number(cursor || '0'),
            });
            return {items: page.items, hasMore: page.hasMore, nextCursor: String(page.offset)};
        },
        google: async cursor => {
            const page = await client.action(api.search.google, {...request, pageToken: cursor});
            return {items: page.items, hasMore: page.hasMore, nextCursor: page.nextPageToken};
        },
    };
}

export const searchResultsMap: SearchResultsMap = {
    clear() {
        clearSearchPointList();
        forgetSearchedArea();
    },
    publishPins(items) {
        replaceSearchPointList(items.map(object => ({object})));
    },
    fit(items, center) {
        if (!objectDetailsOverlay.isOpen) {
            fitMarkerList(items, center);
        }
    },
    rememberArea() {
        if (!objectDetailsOverlay.isOpen) {
            rememberSearchedArea();
        }
    },
};
