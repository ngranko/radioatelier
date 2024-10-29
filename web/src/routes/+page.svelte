<script lang="ts">
    import {createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {listObjects} from '$lib/api/object';
    import type {Object} from '$lib/interfaces/object';
    import {/*mapLoader, */ map, activeObjectInfo, markerList} from '$lib/stores/map';
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

    const client = useQueryClient();

    let orientationEnabled = false;
    let savedLocation: Location | null = null;
    let consoleElement: HTMLElement;

    const objects = createQuery({queryKey: ['objects'], queryFn: listObjects});
    $: if (
        $objects.isError &&
        $objects.error instanceof RequestError &&
        $objects.error.isAuthorizationError()
    ) {
        goto(`/login?ref=${encodeURIComponent($page.url.pathname)}`);
    }

    $: if ($objects.isSuccess) {
        markerList.set($objects.data.data.objects);
    }

    const meQuery = createQuery({queryKey: ['me'], queryFn: me});
    $: if ($meQuery.isSuccess && $meQuery.data.data.role === 'admin') {
        import('eruda').then(eruda =>
            eruda.default.init({container: consoleElement, tool: ['console', 'elements']}),
        );
    }

    onMount(() => {
        // let's try it in case android allows to do it
        toggleOrientation();
        //     const {ControlPosition} = await $mapLoader.importLibrary('core');
        //
        //     // // Create the search box and link it to the UI element.
        //     const input = document.getElementById('pac-input') as HTMLInputElement;
        //     try {
        //         console.log('initializing search box');
        //         const placesLib = await $mapLoader.importLibrary('places');
        //         console.log(placesLib);
        //         const searchBox = new placesLib.SearchBox(input);
        //
        //         $map.controls[ControlPosition.TOP_RIGHT].push(input);
        //
        //         // Bias the SearchBox results towards current map's viewport.
        //         $map.addListener('bounds_changed', () => {
        //             searchBox.setBounds($map.getBounds() as google.maps.LatLngBounds);
        //         });
        //     } catch (e) {
        //         console.error(e);
        //     }
    });

    function handleMapClick(event: CustomEvent<Location>) {
        savedLocation = {lat: event.detail.lat, lng: event.detail.lng};
        activeObjectInfo.set({
            isLoading: false,
            isEditing: true,
            isDirty: false,
            detailsId: new Date().getTime().toString(),
            object: {
                id: null,
                lat: String(savedLocation!.lat),
                lng: String(savedLocation!.lng),
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
            typeof DeviceOrientationEvent.requestPermission === 'function'
        ) {
            console.log('DeviceOrientationEvent supported');
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    console.log(permissionState);
                    orientationEnabled = true;
                })
                .catch(error => {
                    console.error('error while requesting DeviceOrientationEvent permission');
                    console.error(error);
                });
        } else {
            console.warn('DeviceOrientationEvent not supported');
        }
    }
</script>

<div bind:this={consoleElement} />

<button
    class={orientationEnabled ? 'orientationButtonActive' : 'orientationButton'}
    on:click={toggleOrientation}
>
    <i class="fa-solid fa-compass"></i>
</button>

<button class="positionButton" on:click={goToLastPosition}>
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
<Map on:click={handleMapClick} />
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
