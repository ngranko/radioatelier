<script lang="ts">
    import Marker from '$lib/components/map/marker.svelte';
    import {markerIconMap} from '$lib/services/map/markerStyling.js';
    import {debugMarkerState} from '$lib/state/debugMarkers.svelte';
    import {mapState} from '$lib/state/map.svelte.ts';
</script>

{#if mapState.isReady}
    {#each debugMarkerState.items as item (item.id)}
        {@const markerIcon = markerIconMap[item.iconKey]}
        <Marker
            instanceId={item.id}
            lat={item.lat}
            lng={item.lng}
            icon={markerIcon.component}
            iconClassName={markerIcon.className}
            color={item.color}
            source="list"
        />
    {/each}
{/if}
