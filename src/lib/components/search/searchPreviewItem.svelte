<script lang="ts">
    import SearchItemCard from '$lib/components/search/searchItemCard.svelte';
    import {setCenter} from '$lib/services/map/map.svelte';
    import type {SearchItem} from '$lib/interfaces/object';
    import {mapState} from '$lib/state/map.svelte.ts';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
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
        if (marker) {
            marker.getOnClick()?.();
        } else if (object.id) {
            objectDetailsOverlay.isMinimized = false;
            objectDetailsOverlay.isDirty = false;
            objectDetailsOverlay.detailsId = object.id;
            objectDetailsOverlay.isEditing = false;
            objectDetailsOverlay.isLoading = true;
            goto(`/object/${object.id}`);
        } else {
            objectDetailsOverlay.isMinimized = false;
            objectDetailsOverlay.isEditing = true;
            objectDetailsOverlay.isDirty = false;
            objectDetailsOverlay.detailsId = new Date().getTime().toString();
            goto(`/object/create?lat=${object.latitude}&lng=${object.longitude}`);
        }
    }
</script>

<SearchItemCard {object} onClick={handleClick} />
