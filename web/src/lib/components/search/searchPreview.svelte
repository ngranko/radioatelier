<script lang="ts">
    import {createQuery} from '@tanstack/svelte-query';
    import {searchPreview} from '$lib/api/object';
    import SearchPreviewItem from './searchPreviewItem.svelte';
    import {cubicInOut} from 'svelte/easing';
    import {fade} from 'svelte/transition';
    import {activeObjectInfo} from '$lib/stores/map';
    import LoadMoreButton from './loadMoreButton.svelte';
    import {searchState} from '$lib/components/search/search.svelte.ts';

    const previewObjects = createQuery({
        queryKey: [
            'searchPreview',
            {query: searchState.query, latitude: searchState.lat, longitude: searchState.lng},
        ],
        queryFn: searchPreview,
    });

    function handleLoadMoreClick() {
        searchState.isResultsShown = true;
    }
</script>

<!-- only show preview if there's no active object, otherwise it will cover a part of a map on mobile even if the details dialog is minimized -->
{#if !$activeObjectInfo.detailsId}
    <div
        class="container absolute w-full top-0 pt-10.5 rounded-t-3xl rounded-b-lg bg-white shadow-sm"
        transition:fade={{duration: 200, easing: cubicInOut}}
    >
        {#if $previewObjects.isLoading}
            <div class="loader">Loading...</div>
        {:else if $previewObjects.isError}
            <div class="pt-2 pr-4 pb-2 pl-4 opacity-75">Что-то пошло не так</div>
        {:else if $previewObjects.data}
            {#if $previewObjects.data.data.items.length === 0}
                <div class="pt-2 pr-4 pb-2 pl-4 opacity-75">Ничего не найдено</div>
            {/if}

            {#each $previewObjects.data.data.items as object}
                <SearchPreviewItem {object} />
            {/each}

            {#if $previewObjects.data.data.hasMore}
                <LoadMoreButton onLoadMoreClick={handleLoadMoreClick} />
            {/if}
        {/if}
    </div>
{/if}
