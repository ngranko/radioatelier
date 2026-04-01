<script lang="ts">
    import SearchItemCard from '$lib/components/search/searchItemCard.svelte';
    import {setCenter} from '$lib/services/map/map.svelte';
    import type {SearchItem} from '$lib/interfaces/object';
    import {mapState} from '$lib/state/map.svelte.ts';

    interface Props {
        id: string;
        object: SearchItem;
    }

    let {id, object}: Props = $props();

    function handleClick() {
        setCenter(object.latitude, object.longitude);
        if (id && mapState.markerManager) {
            const marker = mapState.markerManager.getMarker(id);
            marker?.getOnClick()?.();
        }
    }
</script>

<SearchItemCard {object} onClick={handleClick} />
