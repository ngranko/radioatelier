<script lang="ts">
    import {createQuery} from '@tanstack/svelte-query';
    import {searchPreview} from '$lib/api/object';
    import TextButton from '$lib/components/button/textButton.svelte';
    import SearchPreviewItem from './searchPreviewItem.svelte';
    import {cubicInOut} from 'svelte/easing';
    import {fade} from 'svelte/transition';

    let {query, latitude, longitude} = $props();

    $effect(() => {
        console.log(query);
    });

    const previewObjects = createQuery({
        queryKey: ['searchPreview', {query, latitude, longitude}],
        queryFn: searchPreview,
    });

    function handleLoadMoreClick() {
        console.log('load more');
    }
</script>

<div class="container" transition:fade={{duration: 200, easing: cubicInOut}}>
    {#if $previewObjects.isLoading}
        <div class="loader">Loading...</div>
    {:else if $previewObjects.isError}
        <div class="error">Error</div>
    {:else if $previewObjects.data}
        {#each $previewObjects.data.data.items as object}
            <SearchPreviewItem {object} />
        {/each}
        {#if $previewObjects.data.data.hasMore}
            <button class="load-more" onclick={handleLoadMoreClick}>
                <TextButton>Больше результатов</TextButton>
            </button>
        {/if}
    {/if}
</div>

<style lang="scss">
    @use '../../../styles/colors';

    .container {
        position: absolute;
        width: 100%;
        top: 0;
        padding-top: 42px;
        border-radius: 24px 24px 10px 10px;
        background-color: colors.$white;
        box-shadow: 0 0 2px colors.$transparentBlack;
    }

    .load-more {
        padding: 4px 8px 8px;
        width: 100%;
        background: none;
        border: 0;
        text-align: left;
        transition: background-color 0.1s ease-in-out;
        cursor: pointer;

        &:hover {
            background-color: colors.$lightgray;
        }
    }
</style>
