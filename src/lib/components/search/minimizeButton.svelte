<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {searchState} from '$lib/components/search/search.svelte.ts';

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
        <i class="fa-solid fa-chevron-down text-xs"></i>
    {:else}
        <i class="fa-solid fa-chevron-up text-xs"></i>
    {/if}
</Button>
