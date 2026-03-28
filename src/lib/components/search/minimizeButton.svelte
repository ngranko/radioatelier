<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {searchState} from '$lib/state/search.svelte';
    import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

    function handleMinimizeClick() {
        searchState.isResultsMinimized = !searchState.isResultsMinimized;
    }
</script>

<Button
    variant="ghost"
    size="icon"
    class="text-muted-foreground hover:text-foreground h-7 w-7 rounded-md"
    onclick={handleMinimizeClick}
    aria-label={searchState.isResultsMinimized ? 'Развернуть' : 'Свернуть'}
>
    {#if searchState.isResultsMinimized}
        <ChevronDownIcon />
    {:else}
        <ChevronUpIcon />
    {/if}
</Button>
