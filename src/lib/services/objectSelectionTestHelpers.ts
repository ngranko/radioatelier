import {page} from '$app/state';
import type {MapProvider} from '$lib/interfaces/map';
import type {SearchItem} from '$lib/interfaces/object';
import {mapState} from '$lib/state/map.svelte';
import {closeMarkerFilter} from '$lib/state/markerFilter.svelte';
import {closeDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
import {clearSearch} from '$lib/state/search.svelte';
import {clearSharedMarker} from '$lib/state/sharedMarker.svelte';
import {registerDetailsExitGuard} from '$lib/utils/detailsExit';
import {vi} from 'vitest';
import {setFocusedTarget} from './map/markerFocus';

let releaseGuard: (() => void) | undefined;

export function resetSelection() {
    releaseGuard?.();
    releaseGuard = undefined;
    closeDetailsOverlay();
    closeMarkerFilter();
    clearSearch();
    clearSharedMarker();
    setFocusedTarget(null);
    page.params.id = undefined;
    mapState.isReady = false;
    mapState.provider = null;
    mapState.markerManager = undefined;
    vi.clearAllMocks();
}

export function holdSelection() {
    let pending: (() => void) | undefined;
    releaseGuard = registerDetailsExitGuard(proceed => {
        pending = proceed;
    });
    return () => pending?.();
}

export function createSearchItem(overrides: Partial<SearchItem> = {}): SearchItem {
    return {
        id: null,
        name: 'Mosaic',
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

export function prepareMap() {
    const provider = {getZoom: () => 15, setCenter: vi.fn(), closeStreetView: vi.fn()};
    mapState.provider = provider as unknown as MapProvider;
    mapState.isReady = true;
    vi.stubGlobal('document', {body: {clientWidth: 375}});
    vi.stubGlobal('window', {innerHeight: 800});
    return provider;
}
