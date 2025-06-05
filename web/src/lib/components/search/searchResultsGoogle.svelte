<script lang="ts">
    import {createInfiniteQuery} from '@tanstack/svelte-query';
    import {searchGoogle} from '$lib/api/object';
    import LoadMoreButton from './loadMoreButton.svelte';
    import {searchPointList} from '$lib/stores/map';
    import {fitMarkerList} from '$lib/services/map/map.svelte';
    import SearchResultsItem from './searchResultsItem.svelte';
    import {searchState} from '$lib/components/search/search.svelte.ts';

    let {isActive} = $props();

    const searchResults = createInfiniteQuery({
        queryKey: [
            'searchGoogle',
            {query: searchState.query, latitude: searchState.lat, longitude: searchState.lng},
        ],
        // TODO: I have no idea why there is a typing error there, but it works
        queryFn: searchGoogle,
        enabled: isActive,
        getNextPageParam: lastPage =>
            lastPage.data.hasMore ? lastPage.data.nextPageToken : undefined,
        initialPageParam: '',
    });

    $effect(() => {
        if (isActive && !$searchResults.data) {
            $searchResults.refetch();
        }
    });

    $effect(() => {
        if (isActive && $searchResults.data) {
            const objects = $searchResults.data.pages
                .map(page => page.data.items)
                .reduce((acc, val) => acc.concat(val), []);
            searchPointList.set(objects.map(item => ({object: item})));

            fitMarkerList(objects, {lat: searchState.lat, lng: searchState.lng});
        }
    });

    function handleLoadMoreClick() {
        $searchResults.fetchNextPage();
    }
</script>

<div class="h-full overflow-y-auto overscroll-contain">
    {#if $searchResults.isLoading}
        <div>Loading...</div>
    {/if}
    {#if $searchResults.isError}
        <div>Error</div>
    {/if}
    {#if $searchResults.isSuccess}
        {#each Object.keys($searchPointList) as id (id)}
            <SearchResultsItem {id} object={$searchPointList[id].object} />
        {/each}
        {#if $searchResults.data.pages[$searchResults.data.pages.length - 1].data.hasMore}
            <LoadMoreButton onLoadMoreClick={handleLoadMoreClick} />
        {/if}
    {/if}
</div>
