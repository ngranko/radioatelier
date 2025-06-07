<script lang="ts">
    import {cubicInOut} from 'svelte/easing';
    import {fly} from 'svelte/transition';
    import {portal} from 'svelte-portal';
    import * as Tabs from '$lib/components/ui/tabs/index.js';
    import SearchResultsLocal from './searchResultsLocal.svelte';
    import SearchResultsGoogle from './searchResultsGoogle.svelte';
    import {searchState} from '$lib/components/search/search.svelte.ts';
    import {clsx} from 'clsx';
    import MinimizeButton from './minimizeButton.svelte';

    let currentTab = $state('local');
    let classes: string = $state('');

    $effect(() => {
        classes = clsx({
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
    <Tabs.Root bind:value={currentTab}>
        <div class="flex justify-between items-center gap-2 mr-2 ml-2">
            <Tabs.List class="min-w-1/2">
                <Tabs.Trigger value="local">Локально</Tabs.Trigger>
                <Tabs.Trigger value="google">Google</Tabs.Trigger>
            </Tabs.List>
            <MinimizeButton />
        </div>
        <Tabs.Content value="local" class="border-t border-t-gray-200 border-solid">
            <div class="h-[calc(100dvh-100px-16px)]">
                {#key `${searchState.lat}:${searchState.lng}`}
                    <SearchResultsLocal isActive={currentTab === 'local'} />
                {/key}
            </div>
        </Tabs.Content>
        <Tabs.Content value="google" class="border-t border-t-gray-200 border-solid">
            <div class="h-[calc(100dvh-100px-16px)]">
                {#key `${searchState.lat}:${searchState.lng}`}
                    <SearchResultsGoogle isActive={currentTab === 'google'} />
                {/key}
            </div>
        </Tabs.Content>
    </Tabs.Root>
</aside>
