<script lang="ts">
    import {searchState} from '$lib/state/search.svelte';
    import type {SearchItem, SearchPageSource, SearchResultsPage} from '$lib/interfaces/object';
    import {fitMarkerList} from '$lib/services/map/map.svelte';
    import {replaceSearchPointList, searchPointList} from '$lib/state/searchPointList.svelte.ts';
    import {Button} from '$lib/components/ui/button';
    import SearchResultsItem from './searchResultsItem.svelte';
    import SearchItemSkeleton from './searchItemSkeleton.svelte';
    import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
    import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
    import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

    let {
        isActive,
        source,
        sourceName,
    }: {isActive: boolean; source: SearchPageSource; sourceName: string} = $props();

    let items = $state<SearchItem[]>([]);
    let hasMore = $state(false);
    let nextCursor = $state('');
    let isLoading = $state(false);
    let isLoadingMore = $state(false);
    let isError = $state(false);
    let isAppendError = $state(false);
    let hasLoaded = $state(false);

    $effect(() => {
        if (isActive && !hasLoaded) {
            void loadPageReplace('');
        }
    });

    $effect(() => {
        if (isActive) {
            replaceSearchPointList(items.map(item => ({object: item})));
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

        void loadPageAppend(nextCursor);
    }

    async function fetchPage(cursor: string): Promise<SearchResultsPage | null> {
        try {
            return await source(cursor);
        } catch (error) {
            console.error(`${sourceName} search failed`, error);
            return null;
        }
    }

    async function loadPageReplace(cursor: string) {
        if (isLoading) {
            return;
        }
        isLoading = true;
        isError = false;

        const page = await fetchPage(cursor);
        isLoading = false;
        if (!page) {
            isError = true;
            return;
        }

        items = page.items;
        hasMore = page.hasMore;
        nextCursor = page.nextCursor;
        hasLoaded = true;
    }

    async function loadPageAppend(cursor: string) {
        if (isLoading || isLoadingMore) {
            return;
        }
        isLoadingMore = true;
        isAppendError = false;

        const page = await fetchPage(cursor);
        isLoadingMore = false;
        if (!page) {
            isAppendError = true;
            return;
        }

        items = [...items, ...page.items];
        hasMore = page.hasMore;
        nextCursor = page.nextCursor;
    }
</script>

<div class="h-full overflow-y-auto overscroll-contain">
    {#if isLoading}
        <div class="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
            <SearchItemSkeleton />
            <SearchItemSkeleton />
            <SearchItemSkeleton />
            <SearchItemSkeleton />
            <SearchItemSkeleton />
        </div>
    {:else if isError}
        <div class="text-muted-foreground flex items-center gap-2.5 px-4 py-6 text-sm">
            <CircleAlertIcon class="text-destructive/70" />
            Не удалось загрузить результаты
        </div>
    {:else if hasLoaded}
        {#if Object.keys(searchPointList).length === 0}
            <div class="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <ZoomOutIcon class="text-muted-foreground/50" />
                <span class="text-muted-foreground text-sm">Ничего не найдено</span>
            </div>
        {:else}
            <div class="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {#each Object.keys(searchPointList) as id (id)}
                    {@const searchPoint = searchPointList[id]}
                    {#if searchPoint?.object}
                        <SearchResultsItem {id} object={searchPoint.object} />
                    {/if}
                {/each}
            </div>
        {/if}

        {#if isAppendError}
            <div
                class="text-muted-foreground flex items-center gap-2.5 border-t border-black/[0.04] px-4 py-3 text-sm dark:border-white/[0.06]"
            >
                <CircleAlertIcon class="text-destructive/70" />
                Не удалось загрузить ещё
            </div>
        {/if}

        {#if hasMore}
            <div class="border-t border-black/[0.04] dark:border-white/[0.06]">
                <Button
                    variant="ghost"
                    class="text-primary hover:text-primary/80 w-full text-xs font-medium"
                    onclick={handleLoadMoreClick}
                    disabled={isLoadingMore}
                >
                    {#if isLoadingMore}
                        <LoaderCircleIcon class="animate-spin" />
                        Загрузка...
                    {:else}
                        Загрузить ещё
                    {/if}
                </Button>
            </div>
        {/if}
    {/if}
</div>
