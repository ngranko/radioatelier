import {normalizeLatitude, normalizeLongitude} from '$lib/utils/coordinates.ts';

export const searchState = $state({
    query: '',
    lat: '',
    lng: '',
    isResultsShown: false,
    isResultsMinimized: false,
});

export function buildSearchUrl(params: {query: string; lat: string; lng: string}): string {
    // We don't do anything that can break reactivity, so it's safe to call the standard class here
    /* eslint-disable-next-line svelte/prefer-svelte-reactivity */
    const searchParams = new URLSearchParams();
    if (params.query) {
        searchParams.set('q', params.query);
    }
    if (params.lat) {
        searchParams.set('lat', params.lat);
    }
    if (params.lng) {
        searchParams.set('lng', params.lng);
    }
    const qs = searchParams.toString();
    return qs ? `/?${qs}` : '/';
}

export function applyUrlToSearchState(url: URL): boolean {
    const q = url.searchParams.get('q')?.trim() ?? '';
    const lat = normalizeLatitude(url.searchParams.get('lat'));
    const lng = normalizeLongitude(url.searchParams.get('lng'));

    if (q && lat !== null && lng !== null) {
        searchState.query = q;
        searchState.lat = lat.toString();
        searchState.lng = lng.toString();
        searchState.isResultsShown = true;
        return true;
    }

    return false;
}

export function getActiveSearchUrl(): string | null {
    if (searchState.query && searchState.lat && searchState.lng && searchState.isResultsShown) {
        return buildSearchUrl({
            query: searchState.query,
            lat: searchState.lat,
            lng: searchState.lng,
        });
    }
    return null;
}
