<script lang="ts">
    import SearchItemCard from '$lib/components/search/searchItemCard.svelte';
    import {setCenter} from '$lib/services/map/map.svelte';
    import type {SearchItem} from '$lib/interfaces/object';
    import {mapState} from '$lib/state/map.svelte.ts';
    import {upsertSearchPoint} from '$lib/state/searchPointList.svelte.ts';
    import {showLoadingDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import {goto} from '$app/navigation';
    import {buildPointUrl} from '$lib/utils/pointRoute.ts';

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
            showLoadingDetailsOverlay(object.id);
            goto(`/object/${object.id}`);
        } else {
            const overlayId = object.googlePlaceId ?? window.crypto.randomUUID();
            upsertSearchPoint(overlayId, {object});
            showLoadingDetailsOverlay(overlayId);
            goto(
                buildPointUrl({
                    latitude: object.latitude,
                    longitude: object.longitude,
                    placeId: object.googlePlaceId,
                }),
            );
        }
    }
</script>

<SearchItemCard {object} onClick={handleClick} />
