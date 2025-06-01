<script lang="ts">
    import SearchBar from '$lib/components/search/searchBar.svelte';
    import SearchPreview from '$lib/components/search/searchPreview.svelte';
    import SearchResults from '$lib/components/search/searchResults.svelte';
    import {map} from '$lib/stores/map';

    let query = $state('');
    let isResultsShown = $state(false);

    // TODO: need a way to reset this variable, otherwise if a user searches for something, then closes the search and then searches again – we skip the preview stage and go straight to details
    function showFullResults() {
        isResultsShown = true;
    }
</script>

<div class="container">
    <SearchBar bind:query />
    {#if query && $map && !isResultsShown}
        {#key query}
            <SearchPreview
                {query}
                latitude={$map.getCenter().lat().toString()}
                longitude={$map.getCenter().lng().toString()}
                onLoadMoreClick={showFullResults}
            />
        {/key}
    {/if}
    {#if query && $map && isResultsShown}
        {#key query}
            <SearchResults
                {query}
                latitude={$map.getCenter().lat().toString()}
                longitude={$map.getCenter().lng().toString()}
            />
        {/key}
    {/if}
</div>

<style lang="scss">
    .container {
        position: relative;
        width: 100%;
        max-width: 384px;
    }
</style>
