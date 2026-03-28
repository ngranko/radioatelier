<script lang="ts">
    import {searchState} from '$lib/state/search.svelte';
    import type {SearchPreviewResponsePayload} from '$lib/interfaces/object';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import {useConvexClient} from 'convex-svelte';
    import SearchPreviewItem from './searchPreviewItem.svelte';
    import LoadMoreButton from './loadMoreButton.svelte';
    import SearchItemSkeleton from './searchItemSkeleton.svelte';
    import {cubicInOut} from 'svelte/easing';
    import {fade} from 'svelte/transition';
    import {api} from '$convex/_generated/api';
    import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
    import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';

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

{#if !objectDetailsOverlay.detailsId}
    <div
        class="glass absolute top-0 flex max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-t-2xl rounded-b-xl pt-11"
        transition:fade={{duration: 120, easing: cubicInOut}}
    >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {#if isLoading}
                <div class="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                    <SearchItemSkeleton />
                    <SearchItemSkeleton />
                    <SearchItemSkeleton />
                </div>
            {:else if isError}
                <div class="text-muted-foreground flex items-center gap-2.5 px-4 py-4 text-sm">
                    <CircleAlertIcon class="text-destructive/70 size-4" />
                    Что-то пошло не так
                </div>
            {:else if results}
                {#if results.items.length === 0}
                    <div class="text-muted-foreground flex items-center gap-2.5 px-4 py-4 text-sm">
                        <ZoomOutIcon class="size-4" />
                        Ничего не найдено
                    </div>
                {:else}
                    <div class="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                        {#each results.items as object (getPreviewKey(object))}
                            <SearchPreviewItem {object} />
                        {/each}
                    </div>
                {/if}

                {#if results.hasMore}
                    <div class="border-t border-black/[0.04] dark:border-white/[0.06]">
                        <LoadMoreButton onLoadMoreClick={handleLoadMoreClick} />
                    </div>
                {/if}
            {/if}
        </div>
    </div>
{/if}
