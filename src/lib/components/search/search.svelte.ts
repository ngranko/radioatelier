export const searchState = $state({
    query: '',
    lat: '',
    lng: '',
    isResultsShown: false,
    isResultsMinimized: false,
});

export function buildSearchUrl(params: {query: string; lat: string; lng: string}): string {
    const sp = new URLSearchParams();
    if (params.query) sp.set('q', params.query);
    if (params.lat) sp.set('lat', params.lat);
    if (params.lng) sp.set('lng', params.lng);
    const qs = sp.toString();
    return qs ? `/?${qs}` : '/';
}

export function applyUrlToSearchState(url: URL): boolean {
    const q = url.searchParams.get('q') ?? '';
    const lat = url.searchParams.get('lat') ?? '';
    const lng = url.searchParams.get('lng') ?? '';

    if (q && lat && lng) {
        searchState.query = q;
        searchState.lat = lat;
        searchState.lng = lng;
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
