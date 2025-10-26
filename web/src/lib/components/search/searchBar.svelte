<script lang="ts">
    import ClearButton from '$lib/components/search/clearButton.svelte';
    import {searchPointList} from '$lib/stores/map';
    import {searchState} from '$lib/components/search/search.svelte.ts';
    import {mapState} from '$lib/state/map.svelte';
    import {Input} from '$lib/components/ui/input';
    import {fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';

    let val: string = $state('');
    let timeout: number | undefined;

    function handleInput(evt: Event) {
        val = (evt.target as HTMLInputElement).value;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const center = mapState.map?.getCenter();
            if (!center) {
                timeout = undefined;
                return;
            }
            searchState.query = (evt.target as HTMLInputElement).value;
            searchState.lat = center.lat().toString();
            searchState.lng = center.lng().toString();
            timeout = undefined;
        }, 400);
    }

    function handleClearClick() {
        searchState.query = '';
        searchState.lat = '';
        searchState.lng = '';
        searchState.isResultsShown = false;
        val = '';
        clearTimeout(timeout);
        timeout = undefined;
        searchPointList.clear();
    }
</script>

<div class="relative z-1">
    <Input
        type="text"
        name="search"
        placeholder="Искать..."
        oninput={handleInput}
        bind:value={val}
        class="relative h-full w-full rounded-full border-none pt-2 pr-10 pb-2 pl-4 shadow-sm"
    />
    {#if val}
        <div
            class="absolute top-1/2 right-0 -translate-y-1/2"
            transition:fade={{duration: 100, easing: cubicInOut}}
        >
            <ClearButton onClick={handleClearClick} />
        </div>
    {/if}
</div>
