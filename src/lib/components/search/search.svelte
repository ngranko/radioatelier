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
    import {onDestroy, onMount} from 'svelte';

    let unsubIdle: (() => void) | undefined;

    const areaSearchCenter = $derived.by(() => {
        const {searched, current} = searchArea;
        if (!searchState.isResultsShown || !searched || !current) {
            return null;
        }
        return shouldOfferAreaSearch(searched, current) ? current.center : null;
    });

    onMount(() => {
        // Idle covers the zooms a drag never reports, and the pans that end without one.
        unsubIdle = mapState.provider!.onIdle(followMapViewport);

        const applied = applyUrlToSearchState(page.url);
        if (applied) {
            mapState.provider!.setCenter(Number(searchState.lat), Number(searchState.lng));
        }
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
    {#if areaSearchCenter}
        <SearchAreaButton
            lat={areaSearchCenter.lat.toString()}
            lng={areaSearchCenter.lng.toString()}
        />
    {/if}
</div>
