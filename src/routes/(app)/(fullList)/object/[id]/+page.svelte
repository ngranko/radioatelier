<script lang="ts">
    import {page} from '$app/state';
    import {api} from '$convex/_generated/api.js';
    import type {Id} from '$convex/_generated/dataModel.js';
    import type {Object as ObjectType} from '$lib/interfaces/object.ts';
    import {
        returnToViewMode,
        showObjectDetailsOverlay,
    } from '$lib/state/objectDetailsOverlay.svelte.js';
    import {useQuery} from 'convex-svelte';
    import posthog from 'posthog-js';
    import {onMount} from 'svelte';

    let {data} = $props();

    const objectId = $derived(page.params.id);
    let lastTrackedObjectId = $state<string | undefined>(undefined);

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
            if (objectId !== lastTrackedObjectId) {
                posthog.capture('object_viewed', {object_id: objectId});
                lastTrackedObjectId = objectId;
            }
        }
    });

    onMount(() => {
        returnToViewMode();
    });
</script>
