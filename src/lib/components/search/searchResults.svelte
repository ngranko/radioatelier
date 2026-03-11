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
    import SearchResultsLocal from './searchResultsLocal.svelte';
    import SearchResultsGoogle from './searchResultsGoogle.svelte';
    import {searchState} from '$lib/components/search/search.svelte.ts';
    import MinimizeButton from './minimizeButton.svelte';
    import {cn} from '$lib/utils.ts';

    let currentTab = $state('local');
    let classes: string = $derived(
        cn({
            'absolute top-0 w-[calc(100vw-16px)] max-w-sm m-2 rounded-2xl overflow-hidden transition-[height] ease-out z-1': true,
            'bg-white/85 shadow-lg shadow-black/[0.08] ring-1 ring-black/[0.06] backdrop-blur-xl': true,
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
        <TabsContent value="local" class="min-h-0 flex-1 border-t border-black/[0.06]">
            <div class="h-full min-h-0">
                {#key `${searchState.lat}:${searchState.lng}`}
                    <SearchResultsLocal isActive={currentTab === 'local'} />
                {/key}
            </div>
        </TabsContent>
        <TabsContent value="google" class="min-h-0 flex-1 border-t border-black/[0.06]">
            <div class="h-full min-h-0">
                {#key `${searchState.lat}:${searchState.lng}`}
                    <SearchResultsGoogle isActive={currentTab === 'google'} />
                {/key}
            </div>
        </TabsContent>
    </TabsRoot>
</aside>
