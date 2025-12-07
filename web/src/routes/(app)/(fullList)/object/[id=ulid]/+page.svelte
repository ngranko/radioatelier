<script lang="ts">
    import {onMount} from 'svelte';
    import type {PageProps} from './$types';
    import {sharedMarker} from '$lib/state/sharedMarker.svelte.ts';
    import {getObjectsContext} from '$lib/context/objects';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';

    let {data}: PageProps = $props();

    let objectsCtx = getObjectsContext();

    onMount(() => {
        if (!objectsCtx.items.find(o => o.id === data.activeObject!.id) && !sharedMarker.object) {
            sharedMarker.object = data.activeObject;
        }

        activeObject.isEditing = false;
        activeObject.isDirty = false;
    });
</script>
