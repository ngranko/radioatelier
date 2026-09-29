<script lang="ts">
    import {replaceState} from '$app/navigation';
    import {page} from '$app/state';
    import SearchAreaButton from '$lib/components/search/searchAreaButton.svelte';
    import SearchBar from '$lib/components/search/searchBar.svelte';
    import SearchPreview from '$lib/components/search/searchPreview.svelte';
    import SearchResults from '$lib/components/search/searchResults.svelte';
    import {mapState} from '$lib/state/map.svelte';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import {searchState, applyUrlToSearchState, buildSearchUrl} from '$lib/state/search.svelte';
    import {
        followMapViewport,
        searchArea,
        shouldOfferAreaSearch,
    } from '$lib/state/searchArea.svelte.ts';
    import {untrack} from 'svelte';

    const areaSearchCenter = $derived.by(() => {
        const {searched, current} = searchArea;
        if (!searchState.isResultsShown || !searched || !current) {
            return null;
        }
        return shouldOfferAreaSearch(searched, current) ? current.center : null;
    });

    // The bar renders before the map so the top bar does not pop in; only the
    // parts that read or move the map wait for it.
    $effect(() => {
        if (mapState.isReady) {
            return untrack(attachToMap);
        }
    });

    function attachToMap() {
        // Idle covers the zooms a drag never reports, and the pans that end without one.
        const unsubIdle = mapState.provider!.onIdle(followMapViewport);

        const applied = applyUrlToSearchState(page.url);
        if (applied) {
            mapState.provider!.setCenter(Number(searchState.lat), Number(searchState.lng));
        }

        return unsubIdle;
    }

    $effect(() => {
        // Until the URL's search is restored above, an empty query would wipe it.
        if (!mapState.isReady) {
            return;
        }
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
</script>

<div class="w-full max-w-sm p-2" inert={objectDetailsOverlay.isOpen}>
    <div class="relative z-2" data-search-scope>
        <SearchBar disabled={objectDetailsOverlay.isOpen || !mapState.isReady} />
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
    {#if areaSearchCenter}
        <SearchAreaButton
            lat={areaSearchCenter.lat.toString()}
            lng={areaSearchCenter.lng.toString()}
        />
    {/if}
</div>
