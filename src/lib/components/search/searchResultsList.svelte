<script lang="ts">
    import Spinner from '$lib/components/spinner.svelte';
    import {Button} from '$lib/components/ui/button';
    import type {SearchResultsListState} from '$lib/services/search/searchResults.svelte';
    import {searchPointList} from '$lib/state/searchPointList.svelte.ts';
    import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
    import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
    import SearchItemSkeleton from './searchItemSkeleton.svelte';
    import SearchResultsItem from './searchResultsItem.svelte';

    let {
        state,
        onLoadMore,
        emptyAction,
    }: {
        state: Readonly<SearchResultsListState>;
        onLoadMore(): void;
        emptyAction?: {label: string; onClick: () => void};
    } = $props();
</script>

<div class="h-full overflow-y-auto overscroll-contain">
    {#if state.isLoading}
        <div class="divide-y divide-black/4 dark:divide-white/6">
            <SearchItemSkeleton />
            <SearchItemSkeleton />
            <SearchItemSkeleton />
            <SearchItemSkeleton />
            <SearchItemSkeleton />
        </div>
    {:else if state.isError}
        <div class="text-muted-foreground flex items-center gap-2.5 px-4 py-6 text-sm">
            <CircleAlertIcon class="text-destructive/70" />
            Не удалось загрузить результаты
        </div>
    {:else if state.hasLoaded}
        {#if Object.keys(searchPointList).length === 0}
            <div class="flex flex-col items-center gap-2 px-4 py-8 text-center">
                <ZoomOutIcon class="text-muted-foreground/50" />
                <span class="text-muted-foreground text-sm">Ничего не найдено</span>
                {#if emptyAction}
                    <Button variant="outline" size="sm" class="mt-1" onclick={emptyAction.onClick}>
                        {emptyAction.label}
                    </Button>
                {/if}
            </div>
        {:else}
            <div class="divide-y divide-black/4 dark:divide-white/6">
                {#each Object.keys(searchPointList) as id (id)}
                    {@const searchPoint = searchPointList[id]}
                    {#if searchPoint?.object}
                        <SearchResultsItem {id} object={searchPoint.object} />
                    {/if}
                {/each}
            </div>
        {/if}

        {#if state.isAppendError}
            <div
                class="text-muted-foreground flex items-center gap-2.5 border-t border-black/4 px-4 py-3 text-sm dark:border-white/6"
            >
                <CircleAlertIcon class="text-destructive/70" />
                Не удалось загрузить ещё
            </div>
        {/if}

        {#if state.hasMore}
            <div class="border-t border-black/4 dark:border-white/6">
                <Button
                    variant="ghost"
                    class="text-primary hover:text-primary/80 w-full text-xs font-medium"
                    onclick={onLoadMore}
                    disabled={state.isLoadingMore}
                >
                    {#if state.isLoadingMore}
                        <Spinner />
                        Загрузка...
                    {:else}
                        Загрузить ещё
                    {/if}
                </Button>
            </div>
        {/if}
    {/if}
</div>
