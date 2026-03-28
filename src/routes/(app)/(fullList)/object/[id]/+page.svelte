<script lang="ts">
    import {onMount} from 'svelte';
    import {
        objectDetailsOverlay,
        showObjectDetailsOverlay,
    } from '$lib/state/objectDetailsOverlay.svelte.js';
    import {useQuery} from 'convex-svelte';
    import {page} from '$app/state';
    import {api} from '$convex/_generated/api.js';
    import type {Id} from '$convex/_generated/dataModel.js';
    import type {Object as ObjectType} from '$lib/interfaces/object.ts';

    let {data} = $props();

    const objectId = $derived(page.params.id);

    const overlayObjectQuery = useQuery(
        api.objects.getDetails,
        () => ({id: objectId as Id<'objects'>}),
        () => ({
            initialData: (data as {activeObject?: ObjectType}).activeObject,
        }),
    );

    $effect(() => {
        if (overlayObjectQuery.data) {
            showObjectDetailsOverlay(objectId!, overlayObjectQuery.data as ObjectType);
        }
    });

    onMount(() => {
        objectDetailsOverlay.isEditing = false;
        objectDetailsOverlay.isDirty = false;
    });
</script>
