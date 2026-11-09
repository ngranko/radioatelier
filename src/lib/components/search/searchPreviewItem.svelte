<script lang="ts">
    import SearchItemCard from '$lib/components/search/searchItemCard.svelte';
    import type {SearchItem} from '$lib/interfaces/object';
    import {selectSearchResult} from '$lib/services/objectSelection';

    interface Props {
        object: SearchItem;
    }

    let {object}: Props = $props();
</script>

<SearchItemCard {object} onClick={() => selectSearchResult(object)} />
