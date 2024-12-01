<script lang="ts">
    import {createQuery} from '@tanstack/svelte-query';
    import {listObjects} from '$lib/api/object';
    import {map, activeObjectInfo, markerList} from '$lib/stores/map';
    import Map from '$lib/components/map/map.svelte';
    import Marker from '$lib/components/map/marker.svelte';
    import UserMenu from '$lib/components/userMenu/userMenu.svelte';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';
    import type {Location} from '$lib/interfaces/location';
    import RequestError from '$lib/errors/RequestError';
    import {goto} from '$app/navigation';
    import {page} from '$app/stores';
    import LocationMarker from '$lib/components/map/locationMarker.svelte';
    import {me} from '$lib/api/user';
    import {onMount} from 'svelte';

    interface DeviceOrientationEventMaybeExtended extends DeviceOrientationEvent {
        requestPermission?(): Promise<'granted' | 'denied'>;
    }

    interface DeviceOrientationEventExtended extends DeviceOrientationEvent {
        requestPermission(): Promise<'granted' | 'denied'>;
    }

    let orientationEnabled = $state(false);
    let consoleElement: HTMLElement | undefined = $state();

    const objects = createQuery({queryKey: ['objects'], queryFn: listObjects});
    $effect(() => {
        if (
            $objects.isError &&
            $objects.error instanceof RequestError &&
            $objects.error.isAuthorizationError()
        ) {
            goto(`/login?ref=${encodeURIComponent($page.url.pathname)}`);
        }
    });

    $effect(() => {
        if ($objects.isSuccess) {
            markerList.set($objects.data.data.objects);
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

        $map.setCenter(position);
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
            console.log('DeviceOrientationEvent supported');
            (window.DeviceOrientationEvent as unknown as DeviceOrientationEventExtended)
                .requestPermission()
                .then((permissionState: string) => {
                    console.log(permissionState);
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

<UserMenu />

{#if $activeObjectInfo.object}
    <ObjectDetails
        initialValues={$activeObjectInfo.object}
        key={$activeObjectInfo.detailsId}
        isLoading={$activeObjectInfo.isLoading}
        isEditing={$activeObjectInfo.isEditing}
    />
{/if}

<!--    <input id="pac-input" class="search" type="text" placeholder="Search Box" />-->
<Map onClick={handleMapClick} />
{#if $map}
    <LocationMarker {orientationEnabled} />
    {#each Object.values($markerList) as marker (marker.id)}
        <Marker
            id={marker.id}
            lat={marker.lat}
            lng={marker.lng}
            isVisited={marker.isVisited}
            isRemoved={marker.isRemoved}
        />
    {/each}

    {#if $activeObjectInfo.object && !$activeObjectInfo.object.id}
        {#key `${$activeObjectInfo.object.lat},${$activeObjectInfo.object.lng}`}
            <Marker
                lat={$activeObjectInfo.object.lat}
                lng={$activeObjectInfo.object.lng}
                initialActive={true}
            />
        {/key}
    {/if}
{/if}

<!--<style>-->
<!--    .search {-->
<!--        margin: 16px;-->
<!--        position: relative;-->
<!--        right: 0;-->
<!--    }-->
<!--</style>-->

<style lang="scss">
    @use '../styles/colors';
    @use '../styles/typography';

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
