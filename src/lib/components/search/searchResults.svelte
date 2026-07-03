<script lang="ts">
    import {cubicInOut} from 'svelte/easing';
    import {fly} from 'svelte/transition';
    import {portal} from 'svelte-portal';
    import {
        Root as TabsRoot,
        List,
        Trigger,
        Content as TabsContent,
    } from '$lib/components/ui/tabs/index.js';
    import SearchResultsList from './searchResultsList.svelte';
    import {searchState} from '$lib/state/search.svelte';
    import MinimizeButton from './minimizeButton.svelte';
    import {cn} from '$lib/utils.ts';
    import type {SearchPageSource} from '$lib/interfaces/object';
    import {useConvexClient} from 'convex-svelte';
    import {api} from '$convex/_generated/api';

    const client = useConvexClient();

    function searchArgs() {
        return {
            query: searchState.query,
            latitude: Number(searchState.lat),
            longitude: Number(searchState.lng),
        };
    }

    const localSource: SearchPageSource = async cursor => {
        const page = await client.action(api.search.local, {
            ...searchArgs(),
            offset: Number(cursor || '0'),
        });
        return {items: page.items, hasMore: page.hasMore, nextCursor: String(page.offset)};
    };

    const googleSource: SearchPageSource = async cursor => {
        const page = await client.action(api.search.google, {
            ...searchArgs(),
            pageToken: cursor,
        });
        return {items: page.items, hasMore: page.hasMore, nextCursor: page.nextPageToken};
    };

    let currentTab = $state('local');
    let classes: string = $derived(
        cn({
            'bg-background absolute top-0 w-[calc(100vw-16px)] max-w-sm m-2 rounded-2xl overflow-hidden transition-[height] ease-out z-1': true,
            'h-[calc(100dvh-16px)]': !searchState.isResultsMinimized,
            'h-25': searchState.isResultsMinimized,
        }),
    );
</script>

<aside
    class={classes}
    transition:fly={{x: -100, duration: 200, easing: cubicInOut}}
    use:portal={'#portal'}
>
    <TabsRoot bind:value={currentTab} class="h-full min-h-0 gap-0 pt-14">
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
                'min-h-0 flex-1 border-t border-black/[0.06] dark:border-white/[0.08]',
                searchState.isResultsMinimized && 'hidden',
            )}
        >
            <div class="h-full min-h-0">
                {#key `${searchState.lat}:${searchState.lng}:${searchState.query}`}
                    <SearchResultsList
                        isActive={currentTab === 'local'}
                        source={localSource}
                        sourceName="Local"
                        emptyAction={{
                            label: 'Поискать в Google',
                            onClick: () => (currentTab = 'google'),
                        }}
                    />
                {/key}
            </div>
        </TabsContent>
        <TabsContent
            value="google"
            class={cn(
                'min-h-0 flex-1 border-t border-black/[0.06] dark:border-white/[0.08]',
                searchState.isResultsMinimized && 'hidden',
            )}
        >
            <div class="h-full min-h-0">
                {#key `${searchState.lat}:${searchState.lng}:${searchState.query}`}
                    <SearchResultsList
                        isActive={currentTab === 'google'}
                        source={googleSource}
                        sourceName="Google"
                    />
                {/key}
            </div>
        </TabsContent>
    </TabsRoot>
</aside>
