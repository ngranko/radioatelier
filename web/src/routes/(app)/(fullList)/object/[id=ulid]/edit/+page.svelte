<script lang="ts">
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {onMount} from 'svelte';
    import {goto} from '$app/navigation';
    import type {Object} from '$lib/interfaces/object.ts';

    onMount(() => {
        if (!activeObject.object) {
            goto('/');
            return;
        }

        if (!(activeObject.object as Object).isOwner && !(activeObject.object as Object).isPublic) {
            goto(`/object/${activeObject.object.id}`);
        }

        activeObject.isEditing = true;
        activeObject.isDirty = false;
    });
</script>
