<script lang="ts">
    import {onMount} from 'svelte';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';

    onMount(() => {
        activeObject.isEditing = false;
        activeObject.isDirty = false;
    });
</script>
