<script lang="ts">
    import SearchBar from '$lib/components/search/searchBar.svelte';
    import SearchPreview from '$lib/components/search/searchPreview.svelte';
    import {map} from '$lib/stores/map';

    let query = $state('');
</script>

<div class="container">
    <SearchBar bind:query />
    {#if query && $map}
        {#key query}
            <SearchPreview
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
