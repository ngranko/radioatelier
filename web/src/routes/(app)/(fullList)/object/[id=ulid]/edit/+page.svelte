<script lang="ts">
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {onMount} from 'svelte';

    onMount(() => {
        activeObject.isEditing = true;
        activeObject.isDirty = false;
    });
</script>
