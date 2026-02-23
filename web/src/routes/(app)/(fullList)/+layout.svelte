<script lang="ts">
    import {page} from '$app/state';
    import {mapState} from '$lib/state/map.svelte.ts';
    import Marker from '$lib/components/map/marker.svelte';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';
    import {activeObject, resetActiveObject} from '$lib/state/activeObject.svelte.ts';
    import type {Object as ObjectType} from '$lib/interfaces/object.ts';
    import {useQuery} from 'convex-svelte';
    import {api} from '$convex/_generated/api.js';
    import {useClerkContext} from 'svelte-clerk';

    let {data, children} = $props();
    let lastRouteObjectId = $state<string | null>(null);

    const ctx = useClerkContext();
    const objects = useQuery(api.markers.list, {}, {initialData: data.objects});

    const renderedObject = $derived.by(() => {
        const object = activeObject.object;
        // TODO: why are those checks here?
        if (!object || !('isOwner' in object) || !('isPublic' in object)) {
            return null;
        }
        return object as ObjectType;
    });
    const detailsKey = $derived(activeObject.detailsId || renderedObject?.id || 'object-details');
    const isOwner = $derived(renderedObject?.isOwner ?? false);
    const isPublic = $derived(renderedObject?.isPublic ?? false);

    $effect(() => {
        const routeObjectId = page.params.id;
        const routeData = page.data as {
            activeObject?: ObjectType;
            activeObjectPromise?: Promise<ObjectType>;
        };

        if (!routeObjectId) {
            if (lastRouteObjectId && activeObject.detailsId === lastRouteObjectId) {
                resetActiveObject();
            }
            lastRouteObjectId = null;
            return;
        }

        lastRouteObjectId = routeObjectId;
        activeObject.detailsId = routeObjectId;

        if (routeData.activeObject) {
            activeObject.object = routeData.activeObject;
            activeObject.isLoading = false;
            return;
        }

        if (routeData.activeObjectPromise) {
            activeObject.object = null;
            activeObject.isLoading = true;
            const expectedId = routeObjectId;

            routeData.activeObjectPromise
                .then(obj => {
                    if (activeObject.detailsId !== expectedId) {
                        return;
                    }
                    activeObject.object = obj;
                    activeObject.isLoading = false;
                })
                .catch((error: unknown) => {
                    if (activeObject.detailsId !== expectedId) {
                        return;
                    }
                    console.error('Failed to load object:', error);
                    activeObject.isLoading = false;
                });
        }
    });

    // TODO: adapt later
    // onMount(() => {
    //     objects.data?.forEach(object => {
    //         if (sharedMarker.object && sharedMarker.object.id === object.id) {
    //             sharedMarker.object = undefined;
    //         }
    //     });
    // });
</script>

{@render children?.()}

{#if renderedObject || activeObject.isLoading}
    <ObjectDetails
        initialValues={renderedObject ?? undefined}
        key={detailsKey}
        isEditing={activeObject.isEditing}
        isLoading={activeObject.isLoading}
        disableIntroAnimation={Boolean((page.data as {activeObject?: ObjectType}).activeObject)}
        permissions={{
            canEditAll: Boolean(ctx.auth.userId) && isOwner,
            canEditPersonal: Boolean(ctx.auth.userId) && !isOwner && isPublic,
        }}
    />
{/if}

{#if mapState.map}
    {#each objects.data ?? data.objects as point (point.id)}
        <Marker
            id={point.id}
            lat={point.latitude}
            lng={point.longitude}
            isVisited={point.isVisited}
            isRemoved={point.isRemoved}
            isDraggable={point.isOwner}
            icon="fa-solid fa-bolt"
            color="#000000"
            source="list"
        />
    {/each}
{/if}
