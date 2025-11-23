<script lang="ts">
    import {onMount} from 'svelte';
    import {sharedMarker} from '$lib/state/sharedMarker.svelte.ts';
    import {mapState} from '$lib/state/map.svelte.ts';
    import Marker from '$lib/components/map/marker.svelte';

    let {data, children} = $props();

    onMount(() => {
        data.objects.forEach(object => {
            if (sharedMarker.object && sharedMarker.object.id === object.id) {
                sharedMarker.object = undefined;
            }
        });
    });
</script>

{@render children?.()}

{#if mapState.map}
    {#each data.objects as point (point.id)}
        <Marker
            id={point.id}
            lat={point.lat}
            lng={point.lng}
            isVisited={point.isVisited}
            isRemoved={point.isRemoved}
            isDraggable={point.isOwner}
            icon="fa-solid fa-bolt"
            color="#000000"
            source="list"
        />
    {/each}
{/if}
