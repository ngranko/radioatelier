<script lang="ts">
    import OrientationButton from '$lib/components/map/orientationButton.svelte';
    import PositionButton from '$lib/components/map/positionButton.svelte';
    import {webgl2Adapter} from '@luma.gl/webgl';
    import type {LayoutProps} from './$types';
    import Map from '$lib/components/map/map.svelte';
    import type {Location} from '$lib/interfaces/location.ts';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';
    import {pointList, searchPointList} from '$lib/stores/map.ts';
    import {mapState} from '$lib/state/map.svelte.ts';
    import LocationMarker from '$lib/components/map/locationMarker.svelte';
    import Marker from '$lib/components/map/marker.svelte';
    import UserMenu from '$lib/components/userMenu/userMenu.svelte';
    import Search from '$lib/components/search/search.svelte';
    import {sharedMarker} from '$lib/state/sharedMarker.svelte.ts';

    // this is needed to avoid deck.gl error
    webgl2Adapter;

    let {data, children}: LayoutProps = $props();

    let consoleElement: HTMLElement | undefined = $state();
    let orientationEnabled = $state(false);

    function handleMapClick(location: Location) {
        if (!data.user.auth) {
            return;
        }

        activeObject.isLoading = false;
        activeObject.isMinimized = false;
        activeObject.isEditing = true;
        activeObject.isDirty = false;
        activeObject.detailsId = new Date().getTime().toString();
        activeObject.object = {
            id: null,
            lat: String(location.lat),
            lng: String(location.lng),
            isVisited: false,
            isRemoved: false,
            isOwner: true,
        };
    }

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

{#if activeObject.object}
    <ObjectDetails
        initialValues={activeObject.object}
        key={activeObject.detailsId}
        isLoading={activeObject.isLoading}
        isEditing={activeObject.isEditing}
        permissions={{
            canEditAll:
                data.user.auth &&
                activeObject.object.id !== sharedMarker.object?.id &&
                activeObject.object.isOwner,
            canEditPersonal:
                data.user.auth &&
                activeObject.object.id !== sharedMarker.object?.id &&
                !activeObject.object.isOwner,
        }}
    />
{/if}

<div class="menu absolute top-2 right-2 left-2 flex items-center justify-between gap-4">
    {#if mapState.map && data.user.auth}
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

    {#each Object.values($pointList) as point (point.object.id)}
        <Marker
            id={point.object.id}
            lat={point.object.lat}
            lng={point.object.lng}
            isVisited={point.object.isVisited}
            isRemoved={point.object.isRemoved}
            isDraggable={point.object.isOwner}
            icon="fa-solid fa-bolt"
            color="#000000"
            source="list"
        />
    {/each}

    {#each Object.keys($searchPointList) as id (id)}
        <Marker
            {id}
            lat={$searchPointList[id].object.lat}
            lng={$searchPointList[id].object.lng}
            icon={$searchPointList[id].object.type === 'local'
                ? 'fa-solid fa-magnifying-glass'
                : 'fa-brands fa-google'}
            color="#dc2626"
            source="search"
        />
    {/each}

    {#if sharedMarker.object}
        {#key `${sharedMarker.object.lat},${sharedMarker.object.lng}`}
            <Marker
                id={sharedMarker.object.id}
                lat={sharedMarker.object.lat}
                lng={sharedMarker.object.lng}
                initialActive={true}
                icon="fa-solid fa-star"
                color="#0085c8"
                source="share"
            />
        {/key}
    {/if}

    {#if activeObject.object && !activeObject.object.id}
        {#key `${activeObject.object.lat},${activeObject.object.lng}`}
            <Marker
                lat={activeObject.object.lat}
                lng={activeObject.object.lng}
                initialActive={true}
                icon="fa-solid fa-seedling"
                color="#000000"
                source="map"
            />
        {/key}
    {/if}
{/if}
