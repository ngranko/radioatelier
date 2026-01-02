<script lang="ts">
    import {onMount} from 'svelte';
    import {page} from '$app/state';
    import {sharedMarker} from '$lib/state/sharedMarker.svelte.ts';
    import {mapState} from '$lib/state/map.svelte.ts';
    import Marker from '$lib/components/map/marker.svelte';
    import {setObjectsContext} from '$lib/context/objects.ts';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import type {ObjectListItem, Object as ObjectType} from '$lib/interfaces/object.ts';

    let {data, children} = $props();
    let shouldUsePageObject = $state(!!page.data.activeObject);
    let lastPageObjectId = $state(page.data.activeObject?.id ?? null);
    let objects = $state<ObjectListItem[]>(data.objects);

    const renderedObject = $derived(
        activeObject.object ?? (shouldUsePageObject ? (page.data.activeObject ?? null) : null),
    );
    const detailsKey = $derived(activeObject.detailsId || renderedObject?.id || 'object-details');
    const isEditing = $derived(
        activeObject.object ? activeObject.isEditing : (page.data.isEditPage ?? false),
    );
    const isOwner = $derived(
        renderedObject && 'isOwner' in renderedObject
            ? (renderedObject as ObjectType).isOwner
            : true,
    );
    const isPublic = $derived(
        renderedObject && 'isPublic' in renderedObject
            ? (renderedObject as ObjectType).isPublic
            : false,
    );

    $effect(() => {
        const nextId = page.data.activeObject?.id ?? null;
        if (nextId !== lastPageObjectId) {
            lastPageObjectId = nextId;
            shouldUsePageObject = !!nextId;
        }
    });

    $effect(() => {
        if (!shouldUsePageObject) {
            return;
        }

        if (activeObject.object || activeObject.detailsId) {
            shouldUsePageObject = false;
        }
    });

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

{#if renderedObject}
    <ObjectDetails
        initialValues={renderedObject}
        key={detailsKey}
        {isEditing}
        permissions={{
            canEditAll: data.user.auth && isOwner,
            canEditPersonal: data.user.auth && !isOwner && isPublic,
        }}
    />
{/if}

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
