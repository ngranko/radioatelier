<script lang="ts">
    import {searchState} from '$lib/components/search/search.svelte.ts';
    import type {SearchItem} from '$lib/interfaces/object';
    import {fitMarkerList} from '$lib/services/map/map.svelte';
    import {searchPointList} from '$lib/stores/map';
    import {useConvexClient} from 'convex-svelte';
    import LoadMoreButton from './loadMoreButton.svelte';
    import SearchResultsItem from './searchResultsItem.svelte';
    import {api} from '$convex/_generated/api';

    let {isActive} = $props();
    const client = useConvexClient();

    let items = $state<SearchItem[]>([]);
    let hasMore = $state(false);
    let nextPageToken = $state('');
    let isLoading = $state(false);
    let isLoadingMore = $state(false);
    let isError = $state(false);
    let hasLoaded = $state(false);

    $effect(() => {
        if (isActive && !hasLoaded) {
            void loadPage('', 'replace');
        }
    });

    $effect(() => {
        if (isActive) {
            searchPointList.set(items.map(item => ({object: item})));
            fitMarkerList(items, {
                latitude: Number(searchState.lat),
                longitude: Number(searchState.lng),
            });
        }
    });

    function handleLoadMoreClick() {
        if (!hasMore || isLoadingMore) {
            return;
        }

        void loadPage(nextPageToken, 'append');
    }

    async function loadPage(pageToken: string, mode: 'replace' | 'append') {
        if (mode === 'replace' && isLoading) {
            return;
        }
        if (mode === 'append' && (isLoading || isLoadingMore)) {
            return;
        }

        if (mode === 'replace') {
            isLoading = true;
            isError = false;
        } else {
            isLoadingMore = true;
        }

        try {
            const page = await client.action(api.search.google, {
                query: searchState.query,
                latitude: Number(searchState.lat),
                longitude: Number(searchState.lng),
                pageToken,
            });

            items = mode === 'append' ? [...items, ...page.items] : page.items;
            hasMore = page.hasMore;
            nextPageToken = page.nextPageToken;
            hasLoaded = true;
        } catch (error) {
            console.error('Google search failed', error);
            isError = true;
        } finally {
            isLoading = false;
            isLoadingMore = false;
        }
    }
</script>

<div class="h-full overflow-y-auto overscroll-contain">
    {#if isLoading}
        <div>Loading...</div>
    {/if}
    {#if isError}
        <div>Error</div>
    {/if}
    {#if hasLoaded}
        {#each Object.keys($searchPointList) as id (id)}
            {@const searchPoint = $searchPointList[id]}
            {#if searchPoint?.object}
                <SearchResultsItem {id} object={searchPoint.object} />
            {/if}
        {/each}
        {#if hasMore}
            <LoadMoreButton onLoadMoreClick={handleLoadMoreClick} />
        {/if}
    {/if}
</div>
