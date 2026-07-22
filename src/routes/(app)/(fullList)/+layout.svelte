<script lang="ts">
    import {page} from '$app/state';
    import {api} from '$convex/_generated/api.js';
    import type {Id} from '$convex/_generated/dataModel';
    import FirstRunHint from '$lib/components/map/firstRunHint.svelte';
    import Marker from '$lib/components/map/marker.svelte';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';
    import type {MarkerListItem} from '$lib/interfaces/marker.ts';
    import type {Object as ObjectType} from '$lib/interfaces/object.ts';
    import {markerIconMap, type MarkerIconKey} from '$lib/services/map/markerStyling.js';
    import {categoriesState} from '$lib/state/categories.svelte.js';
    import {createDraftState} from '$lib/state/createDraft.svelte.ts';
    import {mapState} from '$lib/state/map.svelte.ts';
    import {
        objectDetailsOverlay,
        closeDetailsOverlay,
    } from '$lib/state/objectDetailsOverlay.svelte.js';
    import {
        clearSharedMarker,
        setSharedMarkerObject,
        sharedMarker,
    } from '$lib/state/sharedMarker.svelte.ts';
    import {useQuery} from 'convex-svelte';
    import {onDestroy} from 'svelte';
    import {useClerkContext} from 'svelte-clerk';
    import {cubicInOut} from 'svelte/easing';
    import {fly} from 'svelte/transition';

    type RenderedMarkerPoint = MarkerListItem & {isVisited: boolean};

    let {data, children} = $props();
    // eslint-disable-next-line svelte/prefer-writable-derived
    let disableOverlayIntro = $state(page.data.isServerRequest);

    const ctx = useClerkContext();
    const authUserId = $derived(ctx.auth.userId ?? ctx.user?.id ?? null);

    // No initialData here: the first-run hint below must distinguish "no
    // markers yet" from "marker list not loaded yet", and with initialData the
    // query reports data=[] with isLoading=false before the server responds.
    // The user ID scopes retained results so an account change cannot render
    // the previous user's marker data.
    const objects = useQuery(
        api.markers.list,
        () => (authUserId ? {authUserId} : 'skip'),
        () => ({keepPreviousData: true}),
    );
    const visitedObjectIds = useQuery(
        api.markers.listVisitedIds,
        () => (authUserId ? {authUserId} : 'skip'),
        () => ({initialData: [], keepPreviousData: true}),
    );

    const overlayValues = $derived(
        objectDetailsOverlay.details ??
            page.data.activeObject ??
            page.data.activePoint?.draft ??
            null,
    );
    const overlayPointDetails = $derived(
        objectDetailsOverlay.pointDetails ?? page.data.activePoint?.preview ?? null,
    );
    const overlayMode = $derived.by(() => {
        if (objectDetailsOverlay.isOpen) {
            return objectDetailsOverlay.mode;
        }

        if (page.data.activePoint) {
            return 'pointPreview';
        }

        return 'objectView';
    });

    const routeObjectId = $derived.by(() => {
        const id = page.params.id;
        return id ? (id as Id<'objects'>) : null;
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
    const canRenderMarkerData = $derived(
        (!ctx.isLoaded && !authUserId) || Boolean(authUserId && !objects.isStale),
    );
    const canRenderVisitedData = $derived(
        (!ctx.isLoaded && !authUserId) || Boolean(authUserId && !visitedObjectIds.isStale),
    );
    const rawMarkerPoints = $derived(
        (canRenderMarkerData ? (objects.data ?? []) : []) as MarkerListItem[],
    );
    const visitedObjectIdSet = $derived.by(
        () =>
            new Set((canRenderVisitedData ? (visitedObjectIds.data ?? []) : []) as Id<'objects'>[]),
    );
    const markerPoints = $derived.by(() => {
        const catalogMarkers = rawMarkerPoints.map(
            (item): RenderedMarkerPoint => ({
                ...item,
                isVisited: visitedObjectIdSet.has(item.id),
            }),
        );

        const activeMarker = getActiveListMarker();
        if (activeMarker && !catalogMarkers.some(item => item.id === activeMarker.id)) {
            return [...catalogMarkers, activeMarker];
        }

        return catalogMarkers;
    });

    const showOverlay = $derived(
        objectDetailsOverlay.isOpen || (page.data.isServerRequest && disableOverlayIntro),
    );

    const showFirstRunHint = $derived(
        mapState.isReady &&
            Boolean(ctx.auth.userId) &&
            canRenderMarkerData &&
            objects.data !== undefined &&
            !rawMarkerPoints.some(point => point.isOwner) &&
            !showOverlay,
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

        const shouldUseSharedMarker = shouldRenderSharedMarker(renderedObject);

        if (sharedMarker.object?.id === renderedObject.id && !shouldUseSharedMarker) {
            clearSharedMarker();
            return;
        }

        if (shouldUseSharedMarker && sharedMarker.object?.id !== renderedObject.id) {
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

    function getActiveListMarker(): RenderedMarkerPoint | null {
        if (!renderedObject || !shouldRenderActiveListMarker(renderedObject)) {
            return null;
        }

        return {
            id: renderedObject.id,
            latitude: renderedObject.latitude,
            longitude: renderedObject.longitude,
            categoryId: renderedObject.category.id,
            isRemoved: renderedObject.isRemoved,
            isPublic: renderedObject.isPublic,
            isOwner: renderedObject.isOwner,
            isVisited: visitedObjectIdSet.has(renderedObject.id) || renderedObject.isVisited,
        };
    }

    function shouldRenderActiveListMarker(object: ObjectType) {
        return object.isOwner || (ctx.isLoaded && Boolean(ctx.auth.userId) && object.isPublic);
    }

    function shouldRenderSharedMarker(object: ObjectType) {
        if (object.isOwner || (ctx.auth.userId && object.isPublic)) {
            return false;
        }

        return ctx.isLoaded;
    }
</script>

{@render children?.()}

{#if showFirstRunHint}
    <FirstRunHint />
{/if}

{#if showOverlay}
    <div
        in:flyTransition
        out:fly={{x: -100, duration: 200, easing: cubicInOut}}
        class="absolute right-0 bottom-0 left-0 z-3"
    >
        <ObjectDetails
            initialValues={overlayValues}
            pointDetails={overlayPointDetails}
            mode={overlayMode}
            permissions={{
                canEditAll: Boolean(ctx.auth.userId) && (isOwner || !renderedObject),
                canEditPersonal: Boolean(ctx.auth.userId) && !isOwner && isPublic,
            }}
        />
    </div>
{/if}

{#if mapState.isReady}
    {#each markerPoints as point (point.id)}
        {@const category = categoriesState.categories[point.categoryId]}
        {@const markerIcon = markerIconMap[category.markerIcon as MarkerIconKey]}
        <Marker
            id={point.id}
            lat={point.latitude}
            lng={point.longitude}
            isVisited={point.isVisited}
            isRemoved={point.isRemoved}
            isDraggable={point.isOwner}
            icon={markerIcon.component}
            iconClassName={markerIcon.className}
            color={category.markerColor}
            source="list"
        />
    {/each}
{/if}
