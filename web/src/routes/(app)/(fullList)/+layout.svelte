<script lang="ts">
    import {onMount} from 'svelte';
    import {sharedMarker} from '$lib/state/sharedMarker.svelte.ts';
    import {mapState} from '$lib/state/map.svelte.ts';
    import Marker from '$lib/components/map/marker.svelte';
    import {setObjectsContext} from '$lib/context/objects.ts';
    import type {ObjectListItem} from '$lib/interfaces/object.ts';

    let {data, children} = $props();

    let objects = $state<ObjectListItem[]>(data.objects);

    $effect(() => {
        objects = data.objects;
    });

    function updateObject(id: string, updates: Partial<ObjectListItem>) {
        const idx = objects.findIndex(o => o.id === id);
        if (idx !== -1) {
            objects[idx] = {...objects[idx], ...updates};
        }
    }

    function addObject(obj: ObjectListItem) {
        objects = [...objects, obj];
    }

    function removeObject(id: string) {
        objects = objects.filter(o => o.id !== id);
    }

    setObjectsContext({
        get items() {
            return objects;
        },
        update: updateObject,
        add: addObject,
        remove: removeObject,
    });

    onMount(() => {
        objects.forEach(object => {
            if (sharedMarker.object && sharedMarker.object.id === object.id) {
                sharedMarker.object = undefined;
            }
        });
    });
</script>

{@render children?.()}

{#if mapState.map}
    {#each objects as point (point.id)}
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
