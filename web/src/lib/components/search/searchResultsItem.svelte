<script lang="ts">
    import SearchItemCard from './searchItemCard.svelte';
    import {setCenter} from '$lib/services/map/map.svelte';
    import type {SearchItem} from '$lib/interfaces/object';
    import {mapState} from '$lib/state/map.svelte.ts';

    interface Props {
        id: string;
        object: SearchItem;
    }

    let {id, object}: Props = $props();

    function handleClick() {
        setCenter(Number(object.lat), Number(object.lng));
        if (id && mapState.markerManager) {
            const marker = mapState.markerManager.getMarker(id);
            if (marker?.getRaw()) {
                google.maps.event.trigger(marker.getRaw()!, 'gmp-click');
            }
        }
    }
</script>

<SearchItemCard {object} onClick={handleClick} />
