<script lang="ts">
    import ClearButton from '$lib/components/search/clearButton.svelte';
    import {map, searchPointList} from '$lib/stores/map';
    import {searchState} from '$lib/components/search/search.svelte.ts';

    let inputRef: HTMLInputElement | undefined = $state();
    let val: string = $state('');
    let timeout: number | undefined;

    function handleInput(evt: Event) {
        val = (evt.target as HTMLInputElement).value;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            searchState.query = (evt.target as HTMLInputElement).value;
            searchState.lat = $map!.getCenter()!.lat().toString();
            searchState.lng = $map!.getCenter()!.lng().toString();
        }, 400);
    }

    function handleClearClick() {
        searchState.query = '';
        searchState.lat = '';
        searchState.lng = '';
        searchState.isResultsShown = false;
        val = '';
        inputRef!.value = '';
        searchPointList.clear();
    }
</script>

<div class="relative z-1">
    <input
        type="text"
        placeholder="Искать..."
        oninput={handleInput}
        bind:this={inputRef}
        class="font-branding text-base relative w-full h-full pt-2 pr-10 pb-2 pl-4 border-none rounded-4xl bg-white shadow-sm"
    />
    {#if val}
        <ClearButton onClick={handleClearClick} />
    {/if}
</div>
