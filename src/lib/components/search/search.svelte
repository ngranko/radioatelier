<script lang="ts">
    import {replaceState} from '$app/navigation';
    import {page} from '$app/state';
    import SearchAreaButton from '$lib/components/search/searchAreaButton.svelte';
    import SearchBar from '$lib/components/search/searchBar.svelte';
    import SearchPreview from '$lib/components/search/searchPreview.svelte';
    import SearchResults from '$lib/components/search/searchResults.svelte';
    import {createSearchResults} from '$lib/services/search/searchResults.svelte';
    import {
        createSearchSources,
        searchResultsMap,
    } from '$lib/services/search/searchResultsAdapters';
    import {mapState} from '$lib/state/map.svelte';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import {searchState, applyUrlToSearchState, buildSearchUrl} from '$lib/state/search.svelte';
    import {
        followMapViewport,
        searchArea,
        shouldOfferAreaSearch,
    } from '$lib/state/searchArea.svelte.ts';
    import {useConvexClient} from 'convex-svelte';
    import {onMount, untrack} from 'svelte';

    const client = useConvexClient();
    const areResultsShown = $derived(Boolean(searchState.query && searchState.isResultsShown));
    const results = $derived(
        areResultsShown
            ? createSearchResults(request => createSearchSources(client, request), searchResultsMap)
            : null,
    );

    onMount(() => {
        applyUrlToSearchState(page.url);
    });

    $effect(() => {
        const current = results;
        // The host outlives the panel's exit animation, so closing it invalidates requests immediately.
        return () => current?.dispose();
    });

    $effect(() => {
        const current = results;
        if (!searchState.query || !searchState.lat || !searchState.lng) {
            return;
        }
        const request = {
            query: searchState.query,
            latitude: Number(searchState.lat),
            longitude: Number(searchState.lng),
        };
        untrack(() => {
            if (current) {
                void current.startSearch(request);
            }
        });
    });

    const areaSearchCenter = $derived.by(() => {
        const {searched, current} = searchArea;
        if (!searchState.isResultsShown || !searched || !current) {
            return null;
        }
        return shouldOfferAreaSearch(searched, current) ? current.center : null;
    });

    $effect(() => {
        if (mapState.isReady) {
            return untrack(attachToMap);
        }
    });

    function attachToMap() {
        // Idle covers the zooms a drag never reports, and the pans that end without one.
        const unsubIdle = mapState.provider!.onIdle(followMapViewport);

        if (objectDetailsOverlay.isOpen) {
            return unsubIdle;
        }
        const current = results?.pages[results.activeSource];
        if (current?.hasLoaded) {
            searchResultsMap.fit(current.items, {
                latitude: Number(searchState.lat),
                longitude: Number(searchState.lng),
            });
            searchResultsMap.rememberArea();
        } else if (searchState.lat && searchState.lng) {
            mapState.provider!.setCenter(Number(searchState.lat), Number(searchState.lng));
        }

        return unsubIdle;
    }

    $effect(() => {
        // Initial URL restoration runs on mount before this map-dependent URL update.
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

<div
    class="w-full max-w-sm p-2 transition-opacity duration-200 ease-out motion-reduce:transition-none {objectDetailsOverlay.isOpen
        ? 'max-sm:opacity-0'
        : ''}"
    inert={objectDetailsOverlay.isOpen}
>
    <div class="relative z-2" data-search-scope>
        <SearchBar
            disabled={objectDetailsOverlay.isOpen ||
                (!mapState.isReady && (!searchState.lat || !searchState.lng))}
        />
        {#if searchState.query && !searchState.isResultsShown}
            {#key searchState.query}
                <SearchPreview />
            {/key}
        {/if}
        {#if results}
            <SearchResults {results} />
        {/if}
    </div>
    {#if areaSearchCenter}
        <SearchAreaButton
            lat={areaSearchCenter.lat.toString()}
            lng={areaSearchCenter.lng.toString()}
        />
    {/if}
</div>
