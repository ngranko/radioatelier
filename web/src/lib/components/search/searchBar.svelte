<script lang="ts">
    import ClearButton from '$lib/components/search/clearButton.svelte';
    import {searchPointList} from '$lib/stores/map';
    import {searchState} from '$lib/components/search/search.svelte.ts';
    import { mapState } from '$lib/state/map.svelte';

    let inputRef: HTMLInputElement | undefined = $state();
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
        inputRef!.value = '';
        clearTimeout(timeout);
        timeout = undefined;
        searchPointList.clear();
    }
</script>

<div class="relative z-1">
    <input
        type="text"
        placeholder="Искать..."
        oninput={handleInput}
        bind:this={inputRef}
        class="relative h-full w-full rounded-4xl border-none bg-white pt-2 pr-10 pb-2 pl-4 shadow-sm"
    />
    {#if val}
        <ClearButton onClick={handleClearClick} />
    {/if}
</div>
