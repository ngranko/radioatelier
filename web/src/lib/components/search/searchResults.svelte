<script lang="ts">
    import {cubicInOut} from 'svelte/easing';
    import {fly} from 'svelte/transition';
    import {portal} from 'svelte-portal';
    import * as Tabs from '$lib/components/ui/tabs/index.js';
    import SearchResultsLocal from './searchResultsLocal.svelte';
    import SearchResultsGoogle from './searchResultsGoogle.svelte';

    let {query, latitude, longitude} = $props();

    let currentTab = $state('local');
</script>

<aside
    class="absolute bottom-0 w-[calc(100vw-16px)] max-w-sm h-[calc(100dvh-16px)] m-2 pt-14 rounded-lg bg-white transition-[height]"
    transition:fly={{x: -100, duration: 200, easing: cubicInOut}}
    use:portal={'#portal'}
>
    <Tabs.Root bind:value={currentTab}>
        <Tabs.List class="w-[calc(100%-16px)] mr-2 ml-2">
            <Tabs.Trigger value="local">Локально</Tabs.Trigger>
            <Tabs.Trigger value="google">Google</Tabs.Trigger>
        </Tabs.List>
        <Tabs.Content value="local">
            <div class="h-[calc(100dvh-100px-16px)]">
                <SearchResultsLocal
                    {query}
                    {latitude}
                    {longitude}
                    isActive={currentTab === 'local'}
                />
            </div>
        </Tabs.Content>
        <Tabs.Content value="google">
            <SearchResultsGoogle
                {query}
                {latitude}
                {longitude}
                isActive={currentTab === 'google'}
            />
        </Tabs.Content>
    </Tabs.Root>
</aside>
