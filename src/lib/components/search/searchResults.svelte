<script lang="ts">
    import {
        Root as TabsRoot,
        List,
        Trigger,
        Content as TabsContent,
    } from '$lib/components/ui/tabs/index.js';
    import type {createSearchResults} from '$lib/services/search/searchResults.svelte';
    import {searchState} from '$lib/state/search.svelte';
    import {cn} from '$lib/utils.ts';
    import {slideFromLeft} from '$lib/utils/motion';
    import MinimizeButton from './minimizeButton.svelte';
    import SearchResultsList from './searchResultsList.svelte';

    let {results}: {results: ReturnType<typeof createSearchResults>} = $props();

    function activateSource(source: string) {
        if (source === 'local' || source === 'google') {
            void results.activateSource(source);
        }
    }

    function loadMore() {
        void results.loadMore();
    }

    function retry() {
        void results.retry();
    }

    const activePage = $derived(results.pages[results.activeSource]);
    let isNoticeShown = $state(false);
    let panelHeight = $state(0);
    let isHeightHeld = $derived(
        isNoticeShown && activePage.isLoading && !searchState.isResultsMinimized,
    );

    $effect.pre(() => {
        if (!activePage.isLoading) {
            isNoticeShown =
                activePage.isError || (activePage.hasLoaded && activePage.items.length === 0);
        }
    });

    let classes: string = $derived(
        cn({
            'bg-background surface-edge absolute top-0 left-0 w-full rounded-2xl overflow-hidden transition-[height] ease-out motion-reduce:transition-none z-0': true,
            'h-[calc(100dvh-24px)]': !searchState.isResultsMinimized && !isNoticeShown,
            'h-auto': !searchState.isResultsMinimized && isNoticeShown,
            'h-24': searchState.isResultsMinimized,
        }),
    );
</script>

<aside
    class={classes}
    style:height={isHeightHeld ? `${panelHeight}px` : undefined}
    bind:offsetHeight={panelHeight}
    aria-label="Результаты поиска"
    transition:slideFromLeft
>
    <TabsRoot
        bind:value={() => results.activeSource, activateSource}
        class="h-full min-h-0 gap-0 pt-12"
    >
        <div class="flex shrink-0 items-center gap-2 px-2 pb-3">
            <List class="h-9 flex-1">
                <Trigger value="local">В архиве</Trigger>
                <Trigger value="google">В Google</Trigger>
            </List>
            <MinimizeButton />
        </div>
        <TabsContent
            value="local"
            class={cn(
                'min-h-0 flex-1 border-t border-black/6 dark:border-white/8',
                searchState.isResultsMinimized && 'hidden',
            )}
        >
            <div class="h-full min-h-0">
                <SearchResultsList
                    state={results.pages.local}
                    onLoadMore={loadMore}
                    onRetry={retry}
                    fallbackAction={{
                        label: 'Поискать в Google',
                        onClick: () => activateSource('google'),
                    }}
                />
            </div>
        </TabsContent>
        <TabsContent
            value="google"
            class={cn(
                'min-h-0 flex-1 border-t border-black/6 dark:border-white/8',
                searchState.isResultsMinimized && 'hidden',
            )}
        >
            <div class="h-full min-h-0">
                <SearchResultsList
                    state={results.pages.google}
                    onLoadMore={loadMore}
                    onRetry={retry}
                />
            </div>
        </TabsContent>
    </TabsRoot>
</aside>
