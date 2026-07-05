<script lang="ts">
    import ClearButton from '$lib/components/search/clearButton.svelte';
    import {clearSearch, searchState} from '$lib/state/search.svelte';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import {mapState} from '$lib/state/map.svelte';
    import {Input} from '$lib/components/ui/input';
    import {fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import {onMount} from 'svelte';
    import {registerEscapeCloseHandler} from '$lib/utils/escapeClose';
    import MarkerFilterTrigger from '$lib/components/markerFilter/markerFilterTrigger.svelte';
    import SearchIcon from '@lucide/svelte/icons/search';

    let {disabled = false}: {disabled?: boolean} = $props();

    let val: string = $state('');
    let timeout: number | undefined;
    let isFocused = $state(false);

    $effect(() => {
        if (!isFocused && !timeout && val !== searchState.query) {
            val = searchState.query;
        }
    });

    function handleInput(evt: Event) {
        val = (evt.target as HTMLInputElement).value;
        clearTimeout(timeout);
        timeout = window.setTimeout(() => {
            searchState.query = (evt.target as HTMLInputElement).value;
            const center = mapState.provider?.getCenter();
            if (center) {
                searchState.lat = center.lat.toString();
                searchState.lng = center.lng.toString();
            }
            timeout = undefined;
        }, 400);
    }

    function handleClearClick() {
        clearSearch();
        val = '';
        clearTimeout(timeout);
        timeout = undefined;
    }

    onMount(() =>
        registerEscapeCloseHandler({
            priority: 10,
            isActive: () =>
                Boolean(searchState.query || val) && !objectDetailsOverlay.isOpen && !disabled,
            close: handleClearClick,
        }),
    );
</script>

<div class="group relative z-1">
    <div
        class="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-sm transition-colors
            {disabled
            ? 'text-muted-foreground/50'
            : isFocused
              ? 'text-primary'
              : 'text-muted-foreground'}"
    >
        <SearchIcon class="size-4" />
    </div>
    <Input
        type="text"
        name="search"
        placeholder="Искать..."
        {disabled}
        oninput={handleInput}
        onfocus={() => (isFocused = true)}
        onblur={() => (isFocused = false)}
        bind:value={val}
        class="glass placeholder:text-muted-foreground/60 focus:ring-primary/25 h-10 w-full rounded-full border-none bg-white/95 pt-2 pr-10
            pb-2 pl-9.5 text-sm shadow-sm transition-all
            ease-out focus:bg-white focus:shadow-md
            dark:bg-neutral-800/90 dark:focus:bg-neutral-800"
    />
    {#if val}
        <div
            class="absolute top-1/2 right-9 -translate-y-1/2"
            transition:fade={{duration: 100, easing: cubicInOut}}
        >
            <ClearButton onClick={handleClearClick} />
        </div>
    {/if}
    {#if !disabled}
        <MarkerFilterTrigger />
    {/if}
</div>
