<script lang="ts">
    import {replaceState} from '$app/navigation';
    import {page} from '$app/state';
    import SearchAreaButton from '$lib/components/search/searchAreaButton.svelte';
    import SearchBar from '$lib/components/search/searchBar.svelte';
    import SearchPreview from '$lib/components/search/searchPreview.svelte';
    import SearchResults from '$lib/components/search/searchResults.svelte';
    import {
        measureViewport,
        shouldOfferAreaSearch,
        type SearchViewport,
    } from '$lib/components/search/searchArea';
    import {mapState} from '$lib/state/map.svelte';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import {searchState, applyUrlToSearchState, buildSearchUrl} from '$lib/state/search.svelte';
    import {onDestroy, onMount} from 'svelte';

    // The area the shown results belong to: the map as it settled after the search,
    // fit of the result pins included.
    let searchedViewport: SearchViewport | null = $state(null);
    let currentViewport: SearchViewport | null = $state(null);
    let unsubIdle: (() => void) | undefined;

    const isAreaSearchOffered = $derived(
        Boolean(
            searchState.isResultsShown &&
                searchedViewport &&
                currentViewport &&
                shouldOfferAreaSearch(searchedViewport, currentViewport),
        ),
    );

    onMount(() => {
        updateViewport();
        // Idle covers the zooms a drag never reports, and the pans that end without one.
        unsubIdle = mapState.provider!.onIdle(updateViewport);

        const applied = applyUrlToSearchState(page.url);
        if (applied) {
            mapState.provider!.setCenter(Number(searchState.lat), Number(searchState.lng));
        }
    });

    // Searching somewhere else leaves the shown results behind, so the next settle
    // of the map becomes the area they belong to.
    $effect(() => {
        void searchState.query;
        void searchState.lat;
        void searchState.lng;
        searchedViewport = null;
    });

    $effect(() => {
        if (searchState.query && searchState.lat && searchState.lng && searchState.isResultsShown) {
            if (page.url.pathname === '/') {
                const url = buildSearchUrl({
                    query: searchState.query,
                    lat: searchState.lat,
                    lng: searchState.lng,
                });
                replaceState(url, {});
            }
        } else if (!searchState.query && page.url.pathname === '/' && page.url.search) {
            replaceState('/', {});
        }
    });

    function updateViewport() {
        const viewport = readViewport();
        if (!viewport) {
            return;
        }

        currentViewport = viewport;
        searchedViewport ??= viewport;
    }

    function readViewport(): SearchViewport | null {
        const center = mapState.provider?.getCenter();
        const bounds = mapState.provider?.getBounds()?.toRect();
        if (!center || !bounds) {
            return null;
        }

        return measureViewport(center, bounds);
    }

    onDestroy(() => {
        unsubIdle?.();
    });
</script>

<div class="w-full max-w-sm p-2" inert={objectDetailsOverlay.isOpen}>
    <div class="relative z-2" data-search-scope>
        <SearchBar disabled={objectDetailsOverlay.isOpen} />
        {#if searchState.query && !searchState.isResultsShown}
            {#key searchState.query}
                <SearchPreview />
            {/key}
        {/if}
        {#if searchState.query && searchState.isResultsShown}
            {#key searchState.query}
                <SearchResults />
            {/key}
        {/if}
    </div>
    {#if isAreaSearchOffered && currentViewport}
        <SearchAreaButton
            lat={currentViewport.center.lat.toString()}
            lng={currentViewport.center.lng.toString()}
        />
    {/if}
</div>
