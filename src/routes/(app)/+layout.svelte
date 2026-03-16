<script lang="ts">
    import OrientationButton from '$lib/components/map/orientationButton.svelte';
    import PositionButton from '$lib/components/map/positionButton.svelte';
    import {webgl2Adapter} from '@luma.gl/webgl';
    import type {LayoutProps} from './$types';
    import Map from '$lib/components/map/map.svelte';
    import type {Location} from '$lib/interfaces/location.ts';
    import {
        createDraftState,
        setCreateDraftInitialValues,
        setCreateDraftPosition,
    } from '$lib/state/createDraft.svelte.ts';
    import {searchPointList} from '$lib/stores/map.ts';
    import {mapState} from '$lib/state/map.svelte.ts';
    import LocationMarker from '$lib/components/map/locationMarker.svelte';
    import Marker from '$lib/components/map/marker.svelte';
    import UserMenu from '$lib/components/userMenu/userMenu.svelte';
    import Search from '$lib/components/search/search.svelte';
    import {sharedMarker} from '$lib/state/sharedMarker.svelte.ts';
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {useClerkContext} from 'svelte-clerk';
    import {activeObject} from '$lib/state/activeObject.svelte';
    import {type LooseObject} from '$lib/interfaces/object';

    // this is needed to avoid deck.gl error
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    webgl2Adapter;

    let {children}: LayoutProps = $props();

    let consoleElement: HTMLElement | undefined = $state();
    let orientationEnabled = $state(false);
    const clerkCtx = useClerkContext();

    function handleMapClick(location: Location) {
        if (!clerkCtx.auth.userId) {
            return;
        }

        const draft: Partial<LooseObject> = {
            id: null,
            latitude: location.lat,
            longitude: location.lng,
            isPublic: false,
            isVisited: false,
            isRemoved: false,
            isOwner: true,
        };

        setCreateDraftPosition({lat: location.lat, lng: location.lng});
        setCreateDraftInitialValues(draft);

        activeObject.isMinimized = false;
        activeObject.isEditing = true;
        activeObject.isDirty = false;
        activeObject.isLoading = true;
        activeObject.detailsId = new Date().getTime().toString();
        activeObject.addressLoading = true;

        goto(`/object/create?lat=${location.lat}&lng=${location.lng}`);
    }

    $effect(() => {
        if (!clerkCtx.isLoaded) {
            return;
        }
        if (clerkCtx.session?.currentTask?.key !== 'reset-password') {
            return;
        }
        const ref = `${page.url.pathname}${page.url.search}`;
        goto(`/login/reset-password?ref=${encodeURIComponent(ref)}`);
    });

    // uncomment if mobile dev tools are required
    // $effect(() => {
    //     if (currentUser.auth && currentUser.profile?.role === 'admin') {
    //         import('eruda').then(eruda =>
    //             eruda.default.init({container: consoleElement, tool: ['console', 'elements']}),
    //         );
    //     } else {
    //         if (consoleElement) {
    //             consoleElement.innerHTML = '';
    //         }
    //     }
    // });
</script>

<div bind:this={consoleElement}></div>

<div class="menu absolute top-2 right-4 left-2 flex items-center justify-between gap-4">
    {#if mapState.map && clerkCtx.auth.userId}
        <Search />
    {:else}
        <div></div>
    {/if}
    <UserMenu />
</div>

<Map onClick={handleMapClick} />

<OrientationButton bind:isEnabled={orientationEnabled} />
<PositionButton />

{@render children?.()}

{#if mapState.map}
    <LocationMarker {orientationEnabled} />

    {#each Object.keys($searchPointList) as searchPointId (searchPointId)}
        {@const searchPoint = $searchPointList[searchPointId]}
        {#if searchPoint?.object}
            <Marker
                id={searchPoint.object.id}
                {searchPointId}
                lat={searchPoint.object.latitude}
                lng={searchPoint.object.longitude}
                icon={searchPoint.object.type === 'local'
                    ? 'fa-solid fa-magnifying-glass'
                    : 'fa-brands fa-google'}
                color="#dc2626"
                source="search"
            />
        {/if}
    {/each}

    {#if sharedMarker.object}
        {#key sharedMarker.object.id}
            <Marker
                id={sharedMarker.object.id}
                lat={sharedMarker.object.latitude}
                lng={sharedMarker.object.longitude}
                icon="fa-solid fa-star"
                color="#008e92"
                source="share"
            />
        {/key}
    {/if}

    {#if createDraftState.position}
        {#key `${createDraftState.position.lat},${createDraftState.position.lng}`}
            <Marker
                lat={createDraftState.position.lat}
                lng={createDraftState.position.lng}
                icon="fa-solid fa-seedling"
                color="#000000"
                source="map"
            />
        {/key}
    {/if}
{/if}
