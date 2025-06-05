<script lang="ts">
    import SearchBar from '$lib/components/search/searchBar.svelte';
    import SearchPreview from '$lib/components/search/searchPreview.svelte';
    import SearchResults from '$lib/components/search/searchResults.svelte';
    import {map} from '$lib/stores/map';
    import {searchState} from '$lib/components/search/search.svelte.ts';
</script>

<div class="w-full max-w-sm p-2">
    <div class="relative">
        <SearchBar />
        {#if searchState.query && $map && !searchState.isResultsShown}
            {#key searchState.query}
                <SearchPreview />
            {/key}
        {/if}
        {#if searchState.query && $map && searchState.isResultsShown}
            {#key searchState.query}
                <SearchResults />
            {/key}
        {/if}
    </div>
</div>
