<script lang="ts">
    import {createQuery} from '@tanstack/svelte-query';
    import {searchPreview} from '$lib/api/object';
    import SearchPreviewItem from './searchPreviewItem.svelte';
    import {cubicInOut} from 'svelte/easing';
    import {fade} from 'svelte/transition';
    import {activeObjectInfo} from '$lib/stores/map';
    import LoadMoreButton from './loadMoreButton.svelte';

    let {query, latitude, longitude, onLoadMoreClick} = $props();

    const previewObjects = createQuery({
        queryKey: ['searchPreview', {query, latitude, longitude}],
        queryFn: searchPreview,
    });
</script>

<!-- only show preview if there's no active object, otherwise it will cover a part of a map on mobile even if the details dialog is minimized -->
{#if !$activeObjectInfo.detailsId}
    <div class="container" transition:fade={{duration: 200, easing: cubicInOut}}>
        {#if $previewObjects.isLoading}
            <div class="loader">Loading...</div>
        {:else if $previewObjects.isError}
            <div class="error">Что-то пошло не так</div>
        {:else if $previewObjects.data}
            {#if $previewObjects.data.data.items.length === 0}
                <div class="empty">Ничего не найдено</div>
            {/if}

            {#each $previewObjects.data.data.items as object}
                <SearchPreviewItem {object} />
            {/each}

            {#if $previewObjects.data.data.hasMore}
                <LoadMoreButton {onLoadMoreClick} />
            {/if}
        {/if}
    </div>
{/if}

<style lang="scss">
    @use '../../../styles/colors';

    .container {
        position: absolute;
        width: 100%;
        top: 0;
        padding-top: 42px;
        border-radius: 24px 24px 8px 8px;
        background-color: colors.$white;
        box-shadow: 0 0 2px colors.$transparentBlack;
    }

    .error {
        padding: 8px 16px;
        opacity: 0.75;
    }

    .empty {
        padding: 8px 16px;
        opacity: 0.75;
    }
</style>
