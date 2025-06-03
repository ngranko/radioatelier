<script lang="ts">
    import {searchPointList} from '$lib/stores/map';
    import SearchItemCard from './searchItemCard.svelte';
    import {setCenter} from '$lib/services/map/map.svelte';
    import type {SearchItem} from '$lib/interfaces/object';

    interface Props {
        id: string;
        object: SearchItem;
    }

    let {id, object}: Props = $props();

    function handleClick() {
        setCenter(Number(object.lat), Number(object.lng));
        if (id && $searchPointList[id]) {
            google.maps.event.trigger($searchPointList[id].marker!, 'gmp-click');
        }
    }
</script>

<SearchItemCard {object} onClick={handleClick} />
