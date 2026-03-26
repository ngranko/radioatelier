<!-- TODO: refactor the crap out of that file, it looks like shit and does everything at once -->
<script lang="ts">
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {cubicInOut} from 'svelte/easing';
    import {onDestroy, untrack} from 'svelte';
    import {fly} from 'svelte/transition';
    import type {Id} from '$convex/_generated/dataModel';
    import {useQuery} from 'convex-svelte';
    import {useClerkContext} from 'svelte-clerk';
    import ZapIcon from '@lucide/svelte/icons/zap';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';
    import Marker from '$lib/components/map/marker.svelte';
    import {getActiveSearchUrl} from '$lib/components/search/search.svelte.ts';
    import type {Object as ObjectType} from '$lib/interfaces/object.ts';
    import {api} from '$convex/_generated/api.js';
    import {activeObject, resetActiveObject} from '$lib/state/activeObject.svelte.ts';
    import {createDraftState} from '$lib/state/createDraft.svelte.ts';
    import {mapState} from '$lib/state/map.svelte.ts';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte.ts';
    import {setSharedMarkerObject, sharedMarker} from '$lib/state/sharedMarker.svelte.ts';

    let {data, children} = $props();
    let lastRouteObjectId: string | null = null;
    const initialObjects = $derived(data.objects);
    const initialServerObjectId = untrack(
        () => (data as {activeObject?: ObjectType}).activeObject?.id ?? null,
    );
    let overlayObjectId = $state<Id<'objects'> | null>(
        (initialServerObjectId as Id<'objects'> | null) ?? null,
    );
    let overlayVisible = $state(Boolean(initialServerObjectId));
    let disableOverlayIntro = $state(Boolean(initialServerObjectId));
    let hasConsumedInitialOverlay = $state(Boolean(initialServerObjectId));
    let dismissedRouteObjectId = $state<string | null>(null);
    let isOverlayClosing = $state(false);
    let isObjectOverlayPending = $state(false);

    const ctx = useClerkContext();
    const objects = useQuery(
        api.markers.list,
        () => (ctx.auth.userId ? {} : 'skip'),
        () => ({initialData: initialObjects}),
    );
    const markerPoints = $derived(objects.data ?? initialObjects);
    const routeObjectId = $derived.by(() => {
        const id = page.params.id;
        return id && id !== 'create' ? (id as Id<'objects'>) : null;
    });
    const overlayRequestObjectId = $derived.by(() => {
        if (createDraftState.initialValues) {
            return null;
        }

        if (activeObject.detailsId) {
            return activeObject.detailsId as Id<'objects'>;
        }

        if (routeObjectId && routeObjectId !== dismissedRouteObjectId) {
            return routeObjectId;
        }

        return null;
    });
    const overlayObjectQuery = useQuery(
        api.objects.getDetails,
        () => (overlayObjectId ? {id: overlayObjectId} : 'skip'),
        () => ({
            initialData:
                overlayObjectId && overlayObjectId === routeObjectId
                    ? (data as {activeObject?: ObjectType}).activeObject
                    : undefined,
        }),
    );
    const renderedObject = $derived(
        createDraftState.initialValues
            ? null
            : ((overlayObjectQuery.data ?? null) as ObjectType | null),
    );
    const isLoading = $derived(
        Boolean(overlayObjectId) &&
            (isObjectOverlayPending || overlayObjectQuery.isLoading) &&
            !renderedObject,
    );
    const showObjectOverlay = $derived(
        !createDraftState.initialValues &&
            overlayVisible &&
            Boolean(overlayObjectId) &&
            (isLoading || renderedObject),
    );
    const showCreateOverlay = $derived(Boolean(createDraftState.initialValues) && overlayVisible);
    const showOverlay = $derived(Boolean(showObjectOverlay || showCreateOverlay));

    $effect(() => {
        objectDetailsOverlay.isOpen = showOverlay;
    });

    onDestroy(() => {
        objectDetailsOverlay.isOpen = false;
    });

    const detailsKey = $derived(
        overlayObjectId ?? createDraftState.initialValues?.id ?? 'object-details',
    );
    const isOwner = $derived(
        renderedObject?.isOwner ??
            (createDraftState.initialValues as ObjectType | undefined)?.isOwner ??
            false,
    );
    const isPublic = $derived(
        renderedObject?.isPublic ??
            (createDraftState.initialValues as ObjectType | undefined)?.isPublic ??
            false,
    );
    const overlayInitialValues = $derived(
        showCreateOverlay
            ? (createDraftState.initialValues ?? undefined)
            : (renderedObject ?? undefined),
    );
    const overlayIsLoading = $derived(showCreateOverlay ? false : isLoading);
    const overlayDisableIntroAnimation = $derived(showCreateOverlay ? false : disableOverlayIntro);

    $effect(() => {
        const routeObjectId = page.params.id;
        if (!routeObjectId || routeObjectId === 'create') {
            if (
                lastRouteObjectId &&
                lastRouteObjectId !== 'create' &&
                activeObject.detailsId === lastRouteObjectId
            ) {
                resetActiveObject();
            }
            lastRouteObjectId = routeObjectId ?? null;
            return;
        }
        lastRouteObjectId = routeObjectId;
    });

    $effect(() => {
        if (!dismissedRouteObjectId || routeObjectId === dismissedRouteObjectId) {
            return;
        }

        dismissedRouteObjectId = null;
    });

    $effect(() => {
        if (!overlayRequestObjectId) {
            return;
        }

        if (isOverlayClosing) {
            return;
        }

        if (overlayVisible && overlayObjectId) {
            return;
        }

        overlayObjectId = overlayRequestObjectId;
        isObjectOverlayPending = true;
        overlayVisible = true;
        isOverlayClosing = false;
        disableOverlayIntro =
            !hasConsumedInitialOverlay &&
            overlayRequestObjectId === routeObjectId &&
            overlayRequestObjectId === initialServerObjectId;
        hasConsumedInitialOverlay = true;
        activeObject.detailsId = overlayRequestObjectId;
    });

    $effect(() => {
        if (!overlayObjectId || !renderedObject || renderedObject.id !== overlayObjectId) {
            return;
        }

        isObjectOverlayPending = false;
    });

    $effect(() => {
        if (!createDraftState.initialValues || overlayVisible) {
            return;
        }

        overlayVisible = true;
    });

    $effect(() => {
        activeObject.isLoading = isLoading;
    });

    $effect(() => {
        if (!renderedObject || !routeObjectId || overlayObjectId !== routeObjectId) {
            return;
        }

        if (
            !markerPoints.some(item => item.id === renderedObject.id) &&
            sharedMarker.object?.id !== renderedObject.id
        ) {
            setSharedMarkerObject(renderedObject);
        }
    });

    function handleCloseRequest() {
        isOverlayClosing = true;
        overlayVisible = false;
        isObjectOverlayPending = false;
        if (routeObjectId === overlayObjectId) {
            dismissedRouteObjectId = routeObjectId;
        }
    }

    function handleOverlayOutroEnd() {
        isOverlayClosing = false;
        overlayObjectId = null;
        isObjectOverlayPending = false;
        if (ctx.auth.userId) {
            goto(getActiveSearchUrl() ?? '/');
        }
    }
</script>

{@render children?.()}

{#if showOverlay}
    <div
        out:fly={{x: -100, duration: 200, easing: cubicInOut}}
        onoutroend={handleOverlayOutroEnd}
        class="absolute right-0 bottom-0 left-0 z-3"
    >
        <ObjectDetails
            initialValues={overlayInitialValues}
            key={detailsKey}
            isEditing={activeObject.isEditing}
            isLoading={overlayIsLoading}
            disableIntroAnimation={overlayDisableIntroAnimation}
            onCloseRequest={handleCloseRequest}
            permissions={{
                canEditAll: Boolean(ctx.auth.userId) && (isOwner || !renderedObject),
                canEditPersonal: Boolean(ctx.auth.userId) && !isOwner && isPublic,
            }}
        />
    </div>
{/if}

{#if mapState.map}
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
