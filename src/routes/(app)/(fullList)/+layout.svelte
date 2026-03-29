<script lang="ts">
    import {page} from '$app/state';
    import {cubicInOut} from 'svelte/easing';
    import {onDestroy} from 'svelte';
    import {fly} from 'svelte/transition';
    import type {Id} from '$convex/_generated/dataModel';
    import {useQuery} from 'convex-svelte';
    import {useClerkContext} from 'svelte-clerk';
    import ZapIcon from '@lucide/svelte/icons/zap';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';
    import Marker from '$lib/components/map/marker.svelte';
    import type {Object as ObjectType} from '$lib/interfaces/object.ts';
    import {api} from '$convex/_generated/api.js';
    import {
        objectDetailsOverlay,
        closeDetailsOverlay,
    } from '$lib/state/objectDetailsOverlay.svelte.js';
    import {createDraftState} from '$lib/state/createDraft.svelte.ts';
    import {mapState} from '$lib/state/map.svelte.ts';
    import {setSharedMarkerObject, sharedMarker} from '$lib/state/sharedMarker.svelte.ts';

    let {data, children} = $props();
    const initialObjects = $derived(data.objects);
    // eslint-disable-next-line svelte/prefer-writable-derived
    let disableOverlayIntro = $state(page.data.isServerRequest);

    const ctx = useClerkContext();

    const objects = useQuery(
        api.markers.list,
        () => (ctx.auth.userId ? {} : 'skip'),
        () => ({initialData: initialObjects}),
    );

    const overlayValues = $derived(objectDetailsOverlay.details ?? page.data.activeObject ?? null);

    const markerPoints = $derived(objects.data ?? initialObjects);
    const routeObjectId = $derived.by(() => {
        const id = page.params.id;
        return id && id !== 'create' ? (id as Id<'objects'>) : null;
    });

    // we need this query here to figure out the shared marker
    const overlayObjectQuery = useQuery(
        api.objects.getDetails,
        () => (routeObjectId ? {id: routeObjectId} : 'skip'),
        () => ({
            initialData: (data as {activeObject?: ObjectType}).activeObject,
        }),
    );
    const renderedObject = $derived(
        createDraftState.position ? null : ((overlayObjectQuery.data ?? null) as ObjectType | null),
    );

    const showOverlay = $derived(
        objectDetailsOverlay.isOpen || (page.data.isServerRequest && disableOverlayIntro),
    );

    const isOwner = $derived(
        renderedObject?.isOwner ?? objectDetailsOverlay.details?.isOwner ?? false,
    );
    const isPublic = $derived(
        renderedObject?.isPublic ?? objectDetailsOverlay.details?.isPublic ?? false,
    );

    $effect(() => {
        disableOverlayIntro = false;
    });

    $effect(() => {
        if (!renderedObject || !routeObjectId) {
            return;
        }

        if (
            !markerPoints.some(item => item.id === renderedObject.id) &&
            sharedMarker.object?.id !== renderedObject.id
        ) {
            setSharedMarkerObject(renderedObject);
        }
    });

    // probably can be safely removed
    onDestroy(() => {
        closeDetailsOverlay();
    });

    function flyTransition(node: HTMLElement) {
        if (disableOverlayIntro) {
            return {duration: 0, css: () => ''};
        }
        return fly(node, {x: -100, duration: 200, easing: cubicInOut});
    }
</script>

{@render children?.()}

{#if showOverlay}
    <div
        in:flyTransition
        out:fly={{x: -100, duration: 200, easing: cubicInOut}}
        class="absolute right-0 bottom-0 left-0 z-3"
    >
        <ObjectDetails
            initialValues={overlayValues}
            permissions={{
                canEditAll: Boolean(ctx.auth.userId) && (isOwner || !renderedObject),
                canEditPersonal: Boolean(ctx.auth.userId) && !isOwner && isPublic,
            }}
        />
    </div>
{/if}

{#if mapState.isReady}
    {#each markerPoints as point (point.id)}
        <Marker
            id={point.id}
            lat={point.latitude}
            lng={point.longitude}
            isVisited={point.isVisited}
            isRemoved={point.isRemoved}
            isDraggable={point.isOwner}
            icon={ZapIcon}
            iconClassName="fill-current"
            color="#000000"
            source="list"
        />
    {/each}
{/if}
