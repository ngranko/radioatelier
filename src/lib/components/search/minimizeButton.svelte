<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {searchState} from '$lib/state/search.svelte';
    import ChevronsDownIcon from '@lucide/svelte/icons/chevrons-down';
    import ChevronsUpIcon from '@lucide/svelte/icons/chevrons-up';

    function handleMinimizeClick() {
        searchState.isResultsMinimized = !searchState.isResultsMinimized;
    }

    const label = $derived(searchState.isResultsMinimized ? 'Развернуть' : 'Свернуть');
</script>

<Button
    variant="ghost"
    size="icon"
    class="text-muted-foreground hover:text-foreground size-8 rounded-full transition-colors"
    onclick={handleMinimizeClick}
    aria-label={label}
    title={label}
>
    {#if searchState.isResultsMinimized}
        <ChevronsDownIcon class="stroke-[2.5]" />
    {:else}
        <ChevronsUpIcon class="stroke-[2.5]" />
    {/if}
</Button>
