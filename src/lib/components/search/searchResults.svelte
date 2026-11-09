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

    // Remounting the lists for each search starts their scroll at the top.
    const searchKey = $derived(`${searchState.lat}:${searchState.lng}:${searchState.query}`);

    let classes: string = $derived(
        cn({
            'bg-background surface-edge fixed top-0 left-0 w-[calc(100vw-16px)] max-w-sm m-2 rounded-2xl overflow-hidden transition-[height] ease-out motion-reduce:transition-none z-0': true,
            'h-[calc(100dvh-16px)]': !searchState.isResultsMinimized,
            'h-25': searchState.isResultsMinimized,
        }),
    );
</script>

<aside class={classes} aria-label="Результаты поиска" transition:slideFromLeft>
    <TabsRoot
        bind:value={() => results.activeSource, activateSource}
        class="h-full min-h-0 gap-0 pt-14"
    >
        <div class="flex shrink-0 items-center gap-2 px-3 pb-2">
            <List class="h-8 min-w-1/2">
                <Trigger value="local">Локально</Trigger>
                <Trigger value="google">Google</Trigger>
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
                {#key searchKey}
                    <SearchResultsList
                        state={results.pages.local}
                        onLoadMore={loadMore}
                        emptyAction={{
                            label: 'Поискать в Google',
                            onClick: () => activateSource('google'),
                        }}
                    />
                {/key}
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
                {#key searchKey}
                    <SearchResultsList state={results.pages.google} onLoadMore={loadMore} />
                {/key}
            </div>
        </TabsContent>
    </TabsRoot>
</aside>
