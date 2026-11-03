<script lang="ts">
    import SearchItemCard from '$lib/components/search/searchItemCard.svelte';
    import type {SearchItem} from '$lib/interfaces/object';
    import type {Marker} from '$lib/services/map/marker';
    import {pointAtMarker, stopPointingAtMarker} from '$lib/services/map/markerHover';
    import {selectSearchResult} from '$lib/services/objectSelection';
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
    onClick={() => selectSearchResult(object)}
    onPointAt={claimMarker}
    onPointAway={releaseMarker}
/>
