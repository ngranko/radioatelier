<script lang="ts">
    import {onMount} from 'svelte';
    import type {PageProps} from './$types';
    import {sharedMarker} from '$lib/state/sharedMarker.svelte.ts';
    import {getObjectsContext} from '$lib/context/objects';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import type {Object} from '$lib/interfaces/object.ts';

    let {data}: PageProps = $props();

    let objectsCtx = getObjectsContext();
    let sharedMarkerChecked = false;

    function checkSharedMarker(obj: Object) {
        if (sharedMarkerChecked) {
            return;
        }
        if (!objectsCtx.items.find(o => o.id === obj.id) && !sharedMarker.object) {
            sharedMarker.object = obj;
        }
        sharedMarkerChecked = true;
    }

    // Handle SSR case where data.activeObject is immediately available
    onMount(() => {
        if (data.activeObject) {
            checkSharedMarker(data.activeObject);
        }

        activeObject.isEditing = false;
        activeObject.isDirty = false;
    });

    // Handle client-side navigation where object loads asynchronously
    $effect(() => {
        if (activeObject.object && !activeObject.isLoading && activeObject.object.id) {
            checkSharedMarker(activeObject.object as Object);
        }
    });
</script>
