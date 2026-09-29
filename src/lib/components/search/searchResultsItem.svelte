<script lang="ts">
    import SearchItemCard from '$lib/components/search/searchItemCard.svelte';
    import type {SearchItem} from '$lib/interfaces/object';
    import {focusDetailsTarget} from '$lib/services/map/map.svelte';
    import type {Marker} from '$lib/services/map/marker';
    import {
        pointAtMarker,
        stopPointingAtAllMarkers,
        stopPointingAtMarker,
    } from '$lib/services/map/markerHover';
    import {mapState} from '$lib/state/map.svelte.ts';
    import {onDestroy} from 'svelte';

    interface Props {
        id: string;
        object: SearchItem;
    }

    let {id, object}: Props = $props();

    // Released by reference: the manager may swap the marker for this id while it is pointed at.
    let claimedMarker: Marker | undefined;

    function findMarker() {
        return id ? mapState.markerManager?.getMarker(id) : undefined;
    }

    function handleClick() {
        // The details highlight takes over the pin, and the inert list may never report the leave.
        stopPointingAtAllMarkers();
        focusDetailsTarget(object.latitude, object.longitude);
        findMarker()?.options.onClick?.();
    }

    function claimMarker() {
        releaseMarker();
        claimedMarker = findMarker();
        pointAtMarker(claimedMarker);
    }

    function releaseMarker() {
        stopPointingAtMarker(claimedMarker);
        claimedMarker = undefined;
    }

    // A row removed under the pointer never reports the leave.
    onDestroy(releaseMarker);
</script>

<SearchItemCard
    {object}
    onClick={handleClick}
    onPointAt={claimMarker}
    onPointAway={releaseMarker}
/>
