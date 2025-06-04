<script lang="ts">
    import {createInfiniteQuery} from '@tanstack/svelte-query';
    import {searchLocal} from '$lib/api/object';
    import LoadMoreButton from './loadMoreButton.svelte';
    import {searchPointList} from '$lib/stores/map';
    import {fitMarkerList} from '$lib/services/map/map.svelte';
    import SearchResultsItem from './searchResultsItem.svelte';

    let {query, latitude, longitude, isActive} = $props();

    const searchResults = createInfiniteQuery({
        queryKey: ['searchLocal', {query, latitude, longitude}],
        // TODO: I have no idea why there is a typing error there, but it works
        queryFn: searchLocal,
        enabled: isActive,
        getNextPageParam: lastPage => (lastPage.data.hasMore ? lastPage.data.offset : undefined),
        initialPageParam: 0,
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

            fitMarkerList(objects, {lat: latitude, lng: longitude});
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
