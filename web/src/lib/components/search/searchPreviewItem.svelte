<script lang="ts">
    import SearchItemCard from './searchItemCard.svelte';
    import {setCenter} from '$lib/services/map/map.svelte';
    import type {SearchItem} from '$lib/interfaces/object';
    import {mapState} from '$lib/state/map.svelte.ts';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {goto} from '$app/navigation';

    interface Props {
        object: SearchItem;
    }

    let {object}: Props = $props();

    function handleClick() {
        if (!mapState.markerManager) {
            return;
        }

        setCenter(object.latitude, object.longitude);
        const marker = object.id ? mapState.markerManager.getMarker(object.id) : null;
        if (marker?.getRaw()) {
            google.maps.event.trigger(marker.getRaw()!, 'gmp-click');
        } else if (object.id) {
            activeObject.isMinimized = false;
            activeObject.isDirty = false;
            activeObject.detailsId = object.id;
            activeObject.isEditing = false;
            activeObject.isLoading = true;
            goto(`/object/${object.id}`);
        } else {
            activeObject.isMinimized = false;
            activeObject.isEditing = true;
            activeObject.isDirty = false;
            activeObject.detailsId = new Date().getTime().toString();
            goto(`/object/create?lat=${object.latitude}&lng=${object.longitude}`);
        }
    }
</script>

<SearchItemCard {object} onClick={handleClick} />
