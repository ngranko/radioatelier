<script lang="ts">
    import {searchState} from '$lib/components/search/search.svelte.ts';
    import type {SearchPreviewResponsePayload} from '$lib/interfaces/object';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {useConvexClient} from 'convex-svelte';
    import SearchPreviewItem from './searchPreviewItem.svelte';
    import LoadMoreButton from './loadMoreButton.svelte';
    import {cubicInOut} from 'svelte/easing';
    import {fade} from 'svelte/transition';
    import {api} from '$convex/_generated/api';

    const client = useConvexClient();

    let results = $state<SearchPreviewResponsePayload | null>(null);
    let isLoading = $state(false);
    let isError = $state(false);

    $effect(() => {
        if (!searchState.query || !searchState.lat || !searchState.lng) {
            results = null;
            isLoading = false;
            isError = false;
            return;
        }

        isLoading = true;
        isError = false;

        void client
            .action(api.search.preview, {
                query: searchState.query,
                latitude: Number(searchState.lat),
                longitude: Number(searchState.lng),
            })
            .then(nextResults => {
                results = nextResults;
            })
            .catch(error => {
                console.error('Preview search failed', error);
                results = null;
                isError = true;
            })
            .finally(() => {
                isLoading = false;
            });
    });

    function handleLoadMoreClick() {
        searchState.isResultsShown = true;
    }

    function getPreviewKey(object: SearchPreviewResponsePayload['items'][number]) {
        return object.id ?? `${object.type}:${object.latitude}:${object.longitude}`;
    }
</script>

<!-- only show preview if there's no active object, otherwise it will cover a part of a map on mobile even if the details dialog is minimized -->
{#if !activeObject.detailsId}
    <div
        class="absolute top-0 container w-full rounded-t-3xl rounded-b-lg bg-white pt-10.5 shadow-sm"
        transition:fade={{duration: 100, easing: cubicInOut}}
    >
        {#if isLoading}
            <div class="loader">Loading...</div>
        {:else if isError}
            <div class="pt-2 pr-4 pb-2 pl-4 opacity-75">Что-то пошло не так</div>
        {:else if results}
            {#if results.items.length === 0}
                <div class="pt-2 pr-4 pb-2 pl-4 opacity-75">Ничего не найдено</div>
            {/if}

            {#each results.items as object (getPreviewKey(object))}
                <SearchPreviewItem {object} />
            {/each}

            {#if results.hasMore}
                <LoadMoreButton onLoadMoreClick={handleLoadMoreClick} />
            {/if}
        {/if}
    </div>
{/if}
