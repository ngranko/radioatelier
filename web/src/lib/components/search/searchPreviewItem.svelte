<script lang="ts">
    import SearchItemCard from './searchItemCard.svelte';
    import {setCenter} from '$lib/services/map/map.svelte';
    import type {SearchItem} from '$lib/interfaces/object';
    import {mapState} from '$lib/state/map.svelte.ts';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';

    interface Props {
        object: SearchItem;
    }

    let {object}: Props = $props();

    function handleClick() {
        if (!mapState.markerManager) {
            return;
        }

        setCenter(Number(object.lat), Number(object.lng));
        const marker = mapState.markerManager.getMarker(object.id);
        if (marker?.getRaw()) {
            google.maps.event.trigger(marker.getRaw()!, 'gmp-click');
        } else {
            activeObject.isMinimized = false;
            activeObject.isEditing = !Boolean(object.id);
            activeObject.isDirty = false;
            activeObject.detailsId = object.id ?? new Date().getTime().toString();
            activeObject.object = {
                id: object.id,
                name: object.name,
                address: object.address,
                city: object.city,
                country: object.country,
                lat: String(object.lat),
                lng: String(object.lng),
                isVisited: false,
                isRemoved: false,
            };
        }
    }
</script>

<SearchItemCard {object} onClick={handleClick} />
