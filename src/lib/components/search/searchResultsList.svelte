<script lang="ts">
    import Spinner from '$lib/components/spinner.svelte';
    import {Button} from '$lib/components/ui/button';
    import type {SearchResultsListState} from '$lib/services/search/searchResults.svelte';
    import {searchPointList} from '$lib/state/searchPointList.svelte.ts';
    import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';
    import RotateCwIcon from '@lucide/svelte/icons/rotate-cw';
    import ZoomOutIcon from '@lucide/svelte/icons/zoom-out';
    import SearchItemSkeleton from './searchItemSkeleton.svelte';
    import SearchNotice from './searchNotice.svelte';
    import SearchResultsItem from './searchResultsItem.svelte';

    let {
        state,
        onLoadMore,
        onRetry,
        fallbackAction,
    }: {
        state: Readonly<SearchResultsListState>;
        onLoadMore(): void;
        onRetry(): void;
        fallbackAction?: {label: string; onClick: () => void};
    } = $props();
</script>

{#snippet fallbackButton()}
    <Button variant="outline" size="sm" class="text-sm" onclick={fallbackAction?.onClick}>
        {fallbackAction?.label}
    </Button>
{/snippet}

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
        <SearchNotice
            icon={CircleAlertIcon}
            iconClass="text-destructive/70"
            message="Не удалось загрузить результаты"
        >
            <Button variant="outline" size="sm" class="text-sm" onclick={onRetry}>
                <RotateCwIcon />
                Повторить
            </Button>
            {#if fallbackAction}
                {@render fallbackButton()}
            {/if}
        </SearchNotice>
    {:else if state.hasLoaded}
        {#if Object.keys(searchPointList).length === 0}
            <SearchNotice
                icon={ZoomOutIcon}
                iconClass="text-muted-foreground/50"
                message="Ничего не найдено"
                children={fallbackAction ? fallbackButton : undefined}
            />
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
