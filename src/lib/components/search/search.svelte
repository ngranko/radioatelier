<script lang="ts">
    import SearchBar from '$lib/components/search/searchBar.svelte';
    import SearchPreview from '$lib/components/search/searchPreview.svelte';
    import SearchResults from '$lib/components/search/searchResults.svelte';
    import {searchState, applyUrlToSearchState, buildSearchUrl} from '$lib/state/search.svelte';
    import {onDestroy, onMount} from 'svelte';
    import SearchAreaButton from './searchAreaButton.svelte';
    import {mapState} from '$lib/state/map.svelte';
    import {page} from '$app/state';
    import {replaceState} from '$app/navigation';
    import {setCenter} from '$lib/services/map/map.svelte';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';

    let centerLat = $state('');
    let centerLng = $state('');
    let unsubDragEnd: (() => void) | undefined;

    onMount(() => {
        updateCenter();
        unsubDragEnd = mapState.provider!.onDragEnd(updateCenter);

        const applied = applyUrlToSearchState(page.url);
        if (applied) {
            setCenter(Number(searchState.lat), Number(searchState.lng));
            centerLat = searchState.lat;
            centerLng = searchState.lng;
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

    function updateCenter() {
        const center = mapState.provider!.getCenter();
        if (!center) {
            return;
        }
        centerLat = center.lat.toString();
        centerLng = center.lng.toString();
    }

    onDestroy(() => {
        unsubDragEnd?.();
    });
</script>

<div class="w-full max-w-sm p-2" inert={objectDetailsOverlay.isOpen}>
    <div class="relative z-2">
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
    {#if searchState.query && (centerLat !== searchState.lat || centerLng !== searchState.lng) && searchState.isResultsShown}
        <SearchAreaButton lat={centerLat} lng={centerLng} />
    {/if}
</div>
