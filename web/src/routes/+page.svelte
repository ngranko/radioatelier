<script lang="ts">
    import {createQuery} from '@tanstack/svelte-query';
    import {listObjects} from '$lib/api/object';
    import {
        map,
        activeObjectInfo,
        pointList,
        searchPointList,
        deckEnabled,
    } from '$lib/stores/map.js';
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
    import {onMount} from 'svelte';
    import Search from '$lib/components/search/search.svelte';

    interface DeviceOrientationEventMaybeExtended extends DeviceOrientationEvent {
        requestPermission?(): Promise<'granted' | 'denied'>;
    }

    interface DeviceOrientationEventExtended extends DeviceOrientationEvent {
        requestPermission(): Promise<'granted' | 'denied'>;
    }

    let isListSet = false;
    let orientationEnabled = $state(false);
    let consoleElement: HTMLElement | undefined = $state();

    const objects = createQuery({queryKey: ['objects'], queryFn: listObjects});
    // TODO: isAuthorizationError is needed for all queries and mutations currently/ Or I need to extend the refresh token validity period on each refresh
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

    onMount(() => {
        // let's try it in case android allows to do it
        toggleOrientation();
    });

    function handleMapClick(location: Location) {
        activeObjectInfo.set({
            isLoading: false,
            isMinimized: false,
            isEditing: true,
            isDirty: false,
            detailsId: new Date().getTime().toString(),
            object: {
                id: null,
                lat: String(location.lat),
                lng: String(location.lng),
                isVisited: false,
                isRemoved: false,
            },
        });
    }

    function goToLastPosition() {
        let position = {lat: 0, lng: 0};
        if (localStorage.getItem('lastPosition')) {
            position = JSON.parse(localStorage.getItem('lastPosition') as string);
        }

        if (position.lat === 0 && position.lng === 0) {
            return;
        }

        if ($map) {
            $map.setCenter(position);
        }
    }

    function toggleOrientation() {
        if (orientationEnabled) {
            orientationEnabled = false;
            return;
        }

        if (
            window.DeviceOrientationEvent &&
            typeof (window.DeviceOrientationEvent as unknown as DeviceOrientationEventMaybeExtended)
                .requestPermission === 'function'
        ) {
            (window.DeviceOrientationEvent as unknown as DeviceOrientationEventExtended)
                .requestPermission()
                .then(() => {
                    orientationEnabled = true;
                })
                .catch((error: unknown) => {
                    console.error('error while requesting DeviceOrientationEvent permission');
                    console.error(error);
                });
        } else {
            console.warn('DeviceOrientationEvent not supported');
        }
    }
</script>

<div bind:this={consoleElement}></div>

<button
    class={orientationEnabled ? 'orientationButtonActive' : 'orientationButton'}
    onclick={toggleOrientation}
    aria-label="Toggle orientation"
>
    <i class="fa-solid fa-compass"></i>
</button>

<button class="positionButton" onclick={goToLastPosition} aria-label="Go to last position">
    <i class="fa-solid fa-location-arrow"></i>
</button>

<div class="menu">
    {#if $map}
        <Search />
    {:else}
        <div></div>
    {/if}
    <UserMenu />
</div>

{#if $activeObjectInfo.object}
    <ObjectDetails
        initialValues={$activeObjectInfo.object}
        key={$activeObjectInfo.detailsId}
        isLoading={$activeObjectInfo.isLoading}
        isEditing={$activeObjectInfo.isEditing}
    />
{/if}

<Map onClick={handleMapClick} />
{#if $map}
    <LocationMarker {orientationEnabled} />
    {#if !$deckEnabled}
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
    {/if}

    {#if !$deckEnabled}
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
    {/if}

    {#if $activeObjectInfo.object && !$activeObjectInfo.object.id}
        {#key `${$activeObjectInfo.object.lat},${$activeObjectInfo.object.lng}`}
            <Marker
                lat={$activeObjectInfo.object.lat}
                lng={$activeObjectInfo.object.lng}
                initialActive={true}
                icon="fa-solid fa-seedling"
                color="#000000"
                source="map"
            />
        {/key}
    {/if}
{/if}

<style lang="scss">
    @use '../styles/colors';
    @use '../styles/typography';

    .menu {
        position: absolute;
        top: 8px;
        left: 8px;
        right: 8px;
        display: flex;
        gap: 16px;
        justify-content: space-between;
        align-items: center;
    }

    .orientationButton {
        @include typography.size-20;
        position: absolute;
        width: 40px;
        padding: 10px;
        border: none;
        border-radius: 2px;
        background-color: white;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
        bottom: 120px;
        right: 10px;
        color: colors.$darkgray;
        cursor: pointer;
        z-index: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: color 0.2s;

        & :global(i) {
            display: block;
            margin-bottom: -2px;
        }
    }

    .orientationButtonActive {
        @extend .orientationButton;
        color: colors.$primary;
    }

    .positionButton {
        @include typography.size-22;
        position: absolute;
        width: 40px;
        padding: 10px;
        border: none;
        border-radius: 2px;
        background-color: white;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
        bottom: 72px;
        right: 10px;
        color: colors.$primary;
        cursor: pointer;
        z-index: 1;
        display: flex;
        justify-content: center;
        align-items: center;

        & :global(i) {
            display: block;
            margin-bottom: -2px;
        }
    }
</style>
