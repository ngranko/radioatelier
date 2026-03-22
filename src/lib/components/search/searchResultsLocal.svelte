<script lang="ts">
    import {searchState} from '$lib/components/search/search.svelte.ts';
    import type {SearchItem} from '$lib/interfaces/object';
    import {fitMarkerList} from '$lib/services/map/map.svelte';
    import {searchPointList} from '$lib/stores/map';
    import {useConvexClient} from 'convex-svelte';
    import {Button} from '$lib/components/ui/button';
    import SearchResultsItem from './searchResultsItem.svelte';
    import SearchItemSkeleton from './searchItemSkeleton.svelte';
    import {api} from '$convex/_generated/api';
    import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
    import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
    import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

    let {isActive} = $props();
    const client = useConvexClient();

    let items = $state<SearchItem[]>([]);
    let hasMore = $state(false);
    let nextOffset = $state(0);
    let isLoading = $state(false);
    let isLoadingMore = $state(false);
    let isError = $state(false);
    let hasLoaded = $state(false);

    $effect(() => {
        if (isActive && !hasLoaded) {
            void loadPage(0, 'replace');
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

        void loadPage(nextOffset, 'append');
    }

    async function loadPage(offset: number, mode: 'replace' | 'append') {
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
            const page = await client.action(api.search.local, {
                query: searchState.query,
                latitude: Number(searchState.lat),
                longitude: Number(searchState.lng),
                offset,
            });

            items = mode === 'append' ? [...items, ...page.items] : page.items;
            hasMore = page.hasMore;
            nextOffset = page.offset;
            hasLoaded = true;
        } catch (error) {
            console.error('Local search failed', error);
            isError = true;
        } finally {
            isLoading = false;
            isLoadingMore = false;
        }
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
        {#if Object.keys($searchPointList).length === 0}
            <div class="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <ZoomOutIcon class="text-muted-foreground/50" />
                <span class="text-muted-foreground text-sm">Ничего не найдено</span>
            </div>
        {:else}
            <div class="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {#each Object.keys($searchPointList) as id (id)}
                    {@const searchPoint = $searchPointList[id]}
                    {#if searchPoint?.object}
                        <SearchResultsItem {id} object={searchPoint.object} />
                    {/if}
                {/each}
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
