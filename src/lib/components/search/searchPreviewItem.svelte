<script lang="ts">
    import {goto} from '$app/navigation';
    import SearchItemCard from '$lib/components/search/searchItemCard.svelte';
    import type {SearchItem} from '$lib/interfaces/object';
    import {focusDetailsTarget} from '$lib/services/map/map.svelte';
    import {mapState} from '$lib/state/map.svelte.ts';
    import {showLoadingDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import {
        clearSelectedSearchPoint,
        selectSearchPoint,
    } from '$lib/state/searchPointList.svelte.ts';
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

        if (object.id) {
            // an existing object has a marker of its own, so the pin of the
            // previously previewed point has nothing left to stand for
            clearSelectedSearchPoint();
            openExistingObject(object.id);
            return;
        }

        const overlayId = selectSearchPoint({object});
        showLoadingDetailsOverlay(overlayId);
        goto(
            buildPointUrl({
                latitude: object.latitude,
                longitude: object.longitude,
                placeId: object.googlePlaceId,
            }),
        );
    }

    function openExistingObject(id: NonNullable<SearchItem['id']>) {
        const marker = mapState.markerManager?.getMarker(id);
        if (marker) {
            marker.options.onClick?.();
            return;
        }

        showLoadingDetailsOverlay(id);
        goto(`/object/${id}`);
    }
</script>

<SearchItemCard {object} onClick={handleClick} />
