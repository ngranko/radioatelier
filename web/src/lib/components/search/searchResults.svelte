<script lang="ts">
    import {cubicInOut} from 'svelte/easing';
    import {fly} from 'svelte/transition';
    import {portal} from 'svelte-portal';
    import {Root as TabsRoot, List, Trigger, Content as TabsContent} from '$lib/components/ui/tabs/index.js';
    import SearchResultsLocal from './searchResultsLocal.svelte';
    import SearchResultsGoogle from './searchResultsGoogle.svelte';
    import {searchState} from '$lib/components/search/search.svelte.ts';
    import MinimizeButton from './minimizeButton.svelte';
    import {cn} from '$lib/utils.ts';

    let currentTab = $state('local');
    let classes: string = $state('');

    $effect(() => {
        classes = cn({
            'absolute top-0 w-[calc(100vw-16px)] max-w-sm m-2 pt-14 rounded-lg bg-white overflow-hidden transition-[height] z-1': true,
            'h-[calc(100dvh-16px)]': !searchState.isResultsMinimized,
            'h-25': searchState.isResultsMinimized,
        });
    });
</script>

<aside
    class={classes}
    transition:fly={{x: -100, duration: 200, easing: cubicInOut}}
    use:portal={'#portal'}
>
    <TabsRoot bind:value={currentTab}>
        <div class="mr-2 ml-2 flex items-center justify-between gap-2">
            <List class="min-w-1/2">
                <Trigger value="local">Локально</Trigger>
                <Trigger value="google">Google</Trigger>
            </List>
            <MinimizeButton />
        </div>
        <TabsContent value="local" class="border-t border-solid border-t-gray-200">
            <div class="h-[calc(100dvh-100px-16px)]">
                {#key `${searchState.lat}:${searchState.lng}`}
                    <SearchResultsLocal isActive={currentTab === 'local'} />
                {/key}
            </div>
        </TabsContent>
        <TabsContent value="google" class="border-t border-solid border-t-gray-200">
            <div class="h-[calc(100dvh-100px-16px)]">
                {#key `${searchState.lat}:${searchState.lng}`}
                    <SearchResultsGoogle isActive={currentTab === 'google'} />
                {/key}
            </div>
        </TabsContent>
    </TabsRoot>
</aside>
