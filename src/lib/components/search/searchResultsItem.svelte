<script lang="ts">
    import SearchItemCard from '$lib/components/search/searchItemCard.svelte';
    import type {SearchItem} from '$lib/interfaces/object';
    import {focusDetailsTarget} from '$lib/services/map/map.svelte';
    import {pointAtMarker, stopPointingAtMarker} from '$lib/services/map/markerHover';
    import {mapState} from '$lib/state/map.svelte.ts';

    interface Props {
        id: string;
        object: SearchItem;
    }

    let {id, object}: Props = $props();

    function findMarker() {
        return id ? mapState.markerManager?.getMarker(id) : undefined;
    }

    function handleClick() {
        // The details highlight takes over the pin, and the inert list may never report the leave.
        pointAtMarker(undefined);
        focusDetailsTarget(object.latitude, object.longitude);
        findMarker()?.options.onClick?.();
    }
</script>

<SearchItemCard
    {object}
    onClick={handleClick}
    onPointAt={() => pointAtMarker(findMarker())}
    onPointAway={() => stopPointingAtMarker(findMarker())}
/>
