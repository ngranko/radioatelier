<script lang="ts">
    import {createQuery} from '@tanstack/svelte-query';
    import {listObjects} from '$lib/api/object';
    import {pointList, searchPointList} from '$lib/stores/map.js';
    import Map from '$lib/components/map/map.svelte';
    import Marker from '$lib/components/map/marker.svelte';
    import UserMenu from '$lib/components/userMenu/userMenu.svelte';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';
    import type {Location} from '$lib/interfaces/location';
    import RequestError from '$lib/errors/RequestError';
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import LocationMarker from '$lib/components/map/locationMarker.svelte';
    import {me} from '$lib/api/user';
    import Search from '$lib/components/search/search.svelte';
    import {webgl2Adapter} from '@luma.gl/webgl';
    import {mapState} from '$lib/state/map.svelte';
    import PositionButton from '$lib/components/map/positionButton.svelte';
    import OrientationButton from '$lib/components/map/orientationButton.svelte';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';

    // this is needed to avoid deck.gl error
    webgl2Adapter;

    let isListSet = false;
    let orientationEnabled = $state(false);
    let consoleElement: HTMLElement | undefined = $state();

    const objects = createQuery({queryKey: ['objects'], queryFn: listObjects});
    // TODO: isAuthorizationError is needed for all queries and mutations currently. Or I need to extend the refresh token validity period on each refresh
    $effect(() => {
        if (
            $objects.isError &&
            $objects.error instanceof RequestError &&
            $objects.error.isAuthorizationError()
        ) {
            goto(`/login?ref=${encodeURIComponent(page.url.pathname)}`);
        }
    });

    $effect(() => {
        if ($objects.isSuccess && !isListSet) {
            pointList.set($objects.data.data.objects.map(object => ({object})));
            isListSet = true;
        }
    });

    const meQuery = createQuery({queryKey: ['me'], queryFn: me});
    $effect(() => {
        if ($meQuery.isSuccess && $meQuery.data.data.role === 'admin') {
            import('eruda').then(eruda =>
                eruda.default.init({container: consoleElement, tool: ['console', 'elements']}),
            );
        }
    });

    function handleMapClick(location: Location) {
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
        };
    }
</script>

<div bind:this={consoleElement}></div>

<OrientationButton />
<PositionButton />

<div class="menu absolute top-2 right-2 left-2 flex items-center justify-between gap-4">
    {#if mapState.map}
        <Search />
    {:else}
        <div></div>
    {/if}
    <UserMenu />
</div>

{#if activeObject.object}
    <ObjectDetails
        initialValues={activeObject.object}
        key={activeObject.detailsId}
        isLoading={activeObject.isLoading}
        isEditing={activeObject.isEditing}
    />
{/if}

<Map onClick={handleMapClick} />
{#if mapState.map}
    <LocationMarker {orientationEnabled} />
    {#each Object.values($pointList) as point (point.object.id)}
        <Marker
            id={point.object.id}
            lat={point.object.lat}
            lng={point.object.lng}
            isVisited={point.object.isVisited}
            isRemoved={point.object.isRemoved}
            isDraggable
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
