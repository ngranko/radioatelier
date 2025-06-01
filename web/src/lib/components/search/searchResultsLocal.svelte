<script lang="ts">
    import {createInfiniteQuery} from '@tanstack/svelte-query';
    import {searchLocal} from '$lib/api/object';
    import SearchPreviewItem from './searchPreviewItem.svelte';
    import LoadMoreButton from './loadMoreButton.svelte';
    import {searchPointList} from '$lib/stores/map';
    import type {Object} from '$lib/interfaces/object';
    import {fitMarkerList} from '$lib/services/map/map.svelte';

    let {query, latitude, longitude, isActive} = $props();

    const searchLocalResults = createInfiniteQuery({
        queryKey: ['searchLocal', {query, latitude, longitude}],
        // TODO: I have no idea why there is a typing error there, but it works
        queryFn: searchLocal,
        enabled: isActive,
        getNextPageParam: lastPage => (lastPage.data.hasMore ? lastPage.data.offset : undefined),
        initialPageParam: 0,
    });

    $effect(() => {
        if (isActive && !$searchLocalResults.data) {
            $searchLocalResults.refetch();
        }
    });

    $effect(() => {
        if ($searchLocalResults.data) {
            const objects = $searchLocalResults.data.pages
                .map(page => page.data.items)
                .reduce((acc, val) => acc.concat(val), []);
            searchPointList.set(objects.map(item => ({object: item as unknown as Object})));

            fitMarkerList(objects);
        }
    });

    function handleLoadMoreClick() {
        $searchLocalResults.fetchNextPage();
    }
</script>

<div class="h-full overflow-y-auto overscroll-contain">
    {#if $searchLocalResults.isLoading}
        <div>Loading...</div>
    {/if}
    {#if $searchLocalResults.isError}
        <div>Error</div>
    {/if}
    {#if $searchLocalResults.isSuccess}
        {#each $searchLocalResults.data.pages
            .map(page => page.data.items)
            .reduce((acc, val) => acc.concat(val), []) as object}
            <SearchPreviewItem {object} />
        {/each}
        {#if $searchLocalResults.data.pages[$searchLocalResults.data.pages.length - 1].data.hasMore}
            <LoadMoreButton onLoadMoreClick={handleLoadMoreClick} />
        {/if}
    {/if}
</div>
