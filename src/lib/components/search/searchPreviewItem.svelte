<script lang="ts">
    import {goto} from '$app/navigation';
    import SearchItemCard from '$lib/components/search/searchItemCard.svelte';
    import type {SearchItem} from '$lib/interfaces/object';
    import {focusDetailsTarget} from '$lib/services/map/map.svelte';
    import {mapState} from '$lib/state/map.svelte.ts';
    import {showLoadingDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import {upsertSearchPoint} from '$lib/state/searchPointList.svelte.ts';
    import {buildPointUrl} from '$lib/utils/pointRoute.ts';

    interface Props {
        object: SearchItem;
    }

    let {object}: Props = $props();

    function handleClick() {
        if (!mapState.markerManager) {
            return;
        }

        focusDetailsTarget(object.latitude, object.longitude);
        const marker = object.id ? mapState.markerManager.getMarker(object.id) : null;
        if (marker) {
            marker.options.onClick?.();
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
