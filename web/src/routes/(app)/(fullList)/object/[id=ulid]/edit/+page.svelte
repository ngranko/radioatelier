<script lang="ts">
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {onMount} from 'svelte';
    import type {PageProps} from './$types';
    import {goto} from '$app/navigation';

    let {data}: PageProps = $props();

    onMount(() => {
        if (!data.activeObject) {
            goto('/');
            return;
        }

        // TODO: if not available for editing – redirect to view mode

        activeObject.isEditing = true;
        activeObject.isDirty = false;
    });
</script>
