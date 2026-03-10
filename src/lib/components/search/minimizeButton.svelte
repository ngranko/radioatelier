<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {searchState} from '$lib/components/search/search.svelte.ts';

    function handleMinimizeClick() {
        searchState.isResultsMinimized = !searchState.isResultsMinimized;
    }
</script>

<Button
    variant="outline"
    size="icon"
    onclick={handleMinimizeClick}
    aria-label={searchState.isResultsMinimized ? 'Развернуть' : 'Свернуть'}
>
    {#if searchState.isResultsMinimized}
        <i class="fa-solid fa-chevron-down"></i>
    {:else}
        <i class="fa-solid fa-chevron-up"></i>
    {/if}
</Button>
