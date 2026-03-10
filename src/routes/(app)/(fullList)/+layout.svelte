<script lang="ts">
    import {page} from '$app/state';
    import {fade} from 'svelte/transition';
    import {mapState} from '$lib/state/map.svelte.ts';
    import Marker from '$lib/components/map/marker.svelte';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';
    import ViewModeSkeleton from '$lib/components/objectDetails/viewMode/viewModeSkeleton.svelte';
    import {activeObject, resetActiveObject} from '$lib/state/activeObject.svelte.ts';
    import {createDraftState} from '$lib/state/createDraft.svelte.ts';
    import type {Object as ObjectType} from '$lib/interfaces/object.ts';
    import {useQuery} from 'convex-svelte';
    import {api} from '$convex/_generated/api.js';
    import {useClerkContext} from 'svelte-clerk';

    let {data, children} = $props();
    let lastRouteObjectId: string | null = null;

    const ctx = useClerkContext();
    const objects = useQuery(api.markers.list, {}, {initialData: data.objects});

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

    const detailsKey = $derived(
        (activeObject.detailsId || createDraftState.initialValues?.id) ?? 'object-details',
    );
    const showPendingObjectOverlay = $derived(
        Boolean(
            activeObject.isLoading && activeObject.detailsId && !createDraftState.initialValues,
        ),
    );
    const isOwner = $derived(
        (createDraftState.initialValues as ObjectType | undefined)?.isOwner ?? false,
    );
    const isPublic = $derived(
        (createDraftState.initialValues as ObjectType | undefined)?.isPublic ?? false,
    );
</script>

{@render children?.()}

{#if showPendingObjectOverlay}
    <div
        class="pointer-events-none absolute bottom-0 z-4 m-2 flex w-[calc(100dvw-8px*2)] max-w-100 flex-col rounded-lg bg-white"
        in:fade={{duration: 120}}
        out:fade={{duration: 140}}
    >
        <div class="flex h-14 items-center border-b p-3">
            <span class="mr-2 flex-1 animate-pulse rounded bg-gray-200 text-transparent">
                Loading
            </span>
        </div>
        <div class="flex-1 overflow-hidden">
            <ViewModeSkeleton />
        </div>
    </div>
{:else if createDraftState.initialValues}
    <ObjectDetails
        initialValues={createDraftState.initialValues}
        key={detailsKey}
        isEditing={activeObject.isEditing}
        isLoading={false}
        disableIntroAnimation={false}
        permissions={{
            canEditAll: Boolean(ctx.auth.userId),
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
