<script lang="ts">
    import {api} from '$convex/_generated/api';
    import {Button} from '$lib/components/ui/button';
    import type {SearchPreviewResponsePayload} from '$lib/interfaces/object';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import {searchState} from '$lib/state/search.svelte';
    import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
    import RotateCwIcon from '@lucide/svelte/icons/rotate-cw';
    import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
    import {useConvexClient} from 'convex-svelte';
    import {cubicInOut} from 'svelte/easing';
    import {fade} from 'svelte/transition';
    import LoadMoreButton from './loadMoreButton.svelte';
    import {focusSearchResults} from './resultFocus';
    import SearchItemSkeleton from './searchItemSkeleton.svelte';
    import SearchNotice from './searchNotice.svelte';
    import SearchPreviewItem from './searchPreviewItem.svelte';

    const client = useConvexClient();

    let results = $state<SearchPreviewResponsePayload | null>(null);
    let isLoading = $state(false);
    let isError = $state(false);

    $effect(() => {
        const request = readPreviewRequest();
        if (!request) {
            results = null;
            isLoading = false;
            isError = false;
            return;
        }
        loadPreview(request);
    });

    function readPreviewRequest() {
        if (!searchState.query || !searchState.lat || !searchState.lng) {
            return null;
        }
        return {
            query: searchState.query,
            latitude: Number(searchState.lat),
            longitude: Number(searchState.lng),
        };
    }

    function loadPreview(request: {query: string; latitude: number; longitude: number}) {
        isLoading = true;
        isError = false;

        void client
            .action(api.search.preview, request)
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
    }

    function handleRetryClick() {
        const request = readPreviewRequest();
        if (request) {
            loadPreview(request);
        }
    }

    function handleLoadMoreClick(evt: MouseEvent) {
        searchState.isResultsShown = true;
        void focusSearchResults(evt.currentTarget as HTMLElement);
    }

    function getPreviewKey(object: SearchPreviewResponsePayload['items'][number]) {
        return object.id ?? `${object.type}:${object.latitude}:${object.longitude}`;
    }
</script>

{#if !objectDetailsOverlay.detailsId}
    <div
        class="bg-background surface-edge absolute top-0 flex max-h-[calc(100dvh-24px)] w-full flex-col overflow-hidden rounded-t-2xl rounded-b-xl pt-11"
        transition:fade={{duration: 120, easing: cubicInOut}}
    >
        <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain">
            {#if isLoading}
                <div class="divide-y divide-black/4 dark:divide-white/6">
                    <SearchItemSkeleton />
                    <SearchItemSkeleton />
                    <SearchItemSkeleton />
                </div>
            {:else if isError}
                <SearchNotice
                    icon={CircleAlertIcon}
                    iconClass="text-destructive/70"
                    message="Не удалось загрузить результаты"
                >
                    <Button variant="outline" size="sm" class="text-sm" onclick={handleRetryClick}>
                        <RotateCwIcon />
                        Повторить
                    </Button>
                </SearchNotice>
            {:else if results}
                {#if results.items.length === 0}
                    <SearchNotice
                        icon={ZoomOutIcon}
                        iconClass="text-muted-foreground/50"
                        message="Ничего не найдено"
                    />
                {:else}
                    <div class="divide-y divide-black/4 dark:divide-white/6">
                        {#each results.items as object (getPreviewKey(object))}
                            <SearchPreviewItem {object} />
                        {/each}
                    </div>
                {/if}

                {#if results.hasMore}
                    <div class="border-t border-black/4 dark:border-white/6">
                        <LoadMoreButton onLoadMoreClick={handleLoadMoreClick} />
                    </div>
                {/if}
            {/if}
        </div>
    </div>
{/if}
