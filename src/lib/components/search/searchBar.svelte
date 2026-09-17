<script lang="ts">
    import ClearButton from '$lib/components/search/clearButton.svelte';
    import {
        focusAdjacentResult,
        focusSearchResults,
        readArrowStep,
    } from '$lib/components/search/resultFocus';
    import {Input} from '$lib/components/ui/input';
    import {mapState} from '$lib/state/map.svelte';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import {clearSearch, searchState} from '$lib/state/search.svelte';
    import {registerEscapeCloseHandler} from '$lib/utils/escapeClose';
    import SearchIcon from '@lucide/svelte/icons/search';
    import posthog from 'posthog-js';
    import {onMount} from 'svelte';
    import {cubicInOut} from 'svelte/easing';
    import {fade} from 'svelte/transition';

    let {disabled = false}: {disabled?: boolean} = $props();

    const DEBOUNCE_MS = 400;

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
            runSearch(val);
            timeout = undefined;
        }, DEBOUNCE_MS);
    }

    function handleKeydown(evt: KeyboardEvent) {
        if (evt.isComposing) {
            return;
        }

        const step = readArrowStep(evt.key);
        if (step && focusAdjacentResult(evt.currentTarget as HTMLElement, step)) {
            evt.preventDefault();
            return;
        }

        if (evt.key !== 'Enter') {
            return;
        }

        evt.preventDefault();
        clearTimeout(timeout);
        timeout = undefined;

        if (!val.trim()) {
            return;
        }

        runSearch(val);
        searchState.isResultsShown = true;
        void focusSearchResults(evt.currentTarget as HTMLElement);
    }

    function runSearch(query: string) {
        searchState.query = query;
        const center = mapState.provider?.getCenter();
        if (center) {
            searchState.lat = center.lat.toString();
            searchState.lng = center.lng.toString();
        }
        if (query) {
            posthog.capture('search_performed', {query_length: query.length});
        }
    }

    function handleClearClick() {
        const active = document.activeElement;
        const scope = active?.closest('[data-search-scope]');
        scope?.querySelector<HTMLInputElement>('input[type="search"]')?.focus();
        clearSearch();
        val = '';
        clearTimeout(timeout);
        timeout = undefined;
    }

    const iconClass = $derived.by(() => {
        if (disabled) {
            return 'text-muted-foreground/50';
        }
        if (isFocused) {
            return 'text-primary';
        }
        return 'text-muted-foreground';
    });

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
        class="pointer-events-none absolute top-1/2 left-3.5 z-10 -translate-y-1/2 text-sm transition-colors {iconClass}"
    >
        <SearchIcon class="size-4" />
    </div>
    <Input
        type="search"
        name="search"
        placeholder="Искать..."
        enterkeyhint="search"
        autocomplete="off"
        autocorrect="off"
        spellcheck={false}
        {disabled}
        oninput={handleInput}
        onkeydown={handleKeydown}
        onfocus={() => (isFocused = true)}
        onblur={() => (isFocused = false)}
        bind:value={val}
        class="glass placeholder:text-muted-foreground/60 focus:ring-primary/25 h-10 w-full rounded-full border-none bg-white/95 pt-2 pr-10
            pb-2 pl-9.5 text-sm shadow-sm transition-all
            ease-out focus:bg-white focus:shadow-md
            dark:bg-neutral-800/90 dark:focus:bg-neutral-800
            [&::-webkit-search-cancel-button]:hidden"
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
