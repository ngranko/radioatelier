<script lang="ts">
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {page} from '$app/state';
    import {onMount} from 'svelte';
    import type {PageProps} from './$types';
    import {sharedMarker} from '$lib/state/sharedMarker.svelte.ts';

    let {data}: PageProps = $props();

    const id = page.params.id;

    onMount(() => {
        if (!data.activeObject) {
            return;
        }

        activeObject.detailsId = id;
        activeObject.object = data.activeObject;

        if (!data.objects.find(o => o.id === data.activeObject!.id)) {
            sharedMarker.object = data.activeObject;
        }
    });
</script>
