<script lang="ts">
    import {onMount} from 'svelte';
    import {page} from '$app/state';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {goto} from '$app/navigation';

    let {data} = $props();

    onMount(() => {
        const lat = page.url.searchParams.get('lat');
        const lng = page.url.searchParams.get('lng');

        if (!lat || !lng) {
            goto('/');
            return;
        }

        activeObject.isMinimized = false;
        activeObject.isEditing = true;
        activeObject.isDirty = false;
        activeObject.detailsId = new Date().getTime().toString();
        activeObject.object = {
            id: null,
            lat,
            lng,
            isVisited: false,
            isRemoved: false,
            isOwner: true,
            ...data.address,
        };
    });
</script>
