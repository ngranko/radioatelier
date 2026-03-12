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
    let isFocused = $state(false);

    function handleInput(evt: Event) {
        val = (evt.target as HTMLInputElement).value;
        clearTimeout(timeout);
        timeout = window.setTimeout(() => {
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

<div class="group relative z-1">
    <div
        class="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-sm transition-colors
            {isFocused ? 'text-primary' : 'text-muted-foreground'}"
    >
        <i class="fa-solid fa-magnifying-glass"></i>
    </div>
    <Input
        type="text"
        name="search"
        placeholder="Искать..."
        oninput={handleInput}
        onfocus={() => (isFocused = true)}
        onblur={() => (isFocused = false)}
        bind:value={val}
        class="glass placeholder:text-muted-foreground/60 focus:ring-primary/25 h-10 w-full rounded-full border-none bg-white/80 pt-2 pr-10
            pb-2 pl-9.5 text-sm shadow-sm transition-all
            ease-out focus:bg-white/95 focus:shadow-md
            dark:focus:bg-white/[0.12]"
    />
    {#if val}
        <div
            class="absolute top-1/2 right-0.5 -translate-y-1/2"
            transition:fade={{duration: 100, easing: cubicInOut}}
        >
            <ClearButton onClick={handleClearClick} />
        </div>
    {/if}
</div>
