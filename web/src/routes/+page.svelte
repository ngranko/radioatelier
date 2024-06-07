<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {base} from '$app/paths';
    import {createMutation, createQuery} from '@tanstack/svelte-query';
    import {createObject, listObjects} from '$lib/api/object';
    import type {CreateObjectInputs} from '$lib/interfaces/object';
    import {mapLoader, map} from '$lib/stores/map';
    import Marker from '$lib/components/map/marker.svelte';
    import ObjectDetails from '$lib/components/objectDetails.svelte';

    interface MarkerItem {
        id: string;
        name?: string;
        lat: string;
        lng: string;
    }

    let container: HTMLDivElement;
    let mapRef: google.maps.Map;
    let zoom = 15;
    let center = {lat: 25.12524288324294, lng: 121.47016458217341};
    const permanentMarkers: {[key: string]: MarkerItem} = {};
    let tempMarker: google.maps.marker.AdvancedMarkerElement | null = null;

    const unsubscribe = map.subscribe(value => {
        mapRef = value;
    });

    const mutation = createMutation({
        mutationFn: createObject,
    });

    const objects = createQuery({queryKey: ['objects'], queryFn: listObjects});

    $: if ($objects.isSuccess) {
        for (const object of $objects.data.data.objects) {
            permanentMarkers[`${object.lat}${object.lng}`] = object;
        }
    }

    onMount(async () => {
        const lastCenter = localStorage.getItem('lastCenter');
        if (lastCenter) {
            center = JSON.parse(lastCenter);
        }

        const {ControlPosition, event} = await $mapLoader.importLibrary('core');

        const mapOptions = {
            zoom,
            center,
            mapId: '5b6e83dfb8822236',
            controlSize: 40,
            // I can always enable it if I see that I need it< but for now let's leave as little controls as I can
            mapTypeControl: false,
            // mapTypeControlOptions: {
            //     style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            //     mapTypeIds: ["roadmap", "satellite"],
            //     position: google.maps.ControlPosition.RIGHT_BOTTOM,
            // },
            fullscreenControl: false,
            zoomControl: false,
            streetViewControlOptions: {
                position: ControlPosition.RIGHT_BOTTOM,
            },
        };

        try {
            const {Map} = await $mapLoader.importLibrary('maps');
            map.update(() => new Map(container, mapOptions));
        } catch (e) {
            console.error('error instantiating map');
            console.error(e);
        }

        const {AdvancedMarkerElement} = await $mapLoader.importLibrary('marker');

        try {
            event.addListener(mapRef, 'click', function (event: google.maps.MapMouseEvent) {
                isInteracted = true;

                if (tempMarker) {
                    tempMarker.map = null;
                    tempMarker = null;
                }

                if (event.latLng) {
                    const icon = document.createElement('img');
                    icon.src = `${base}/pointDefault.svg`;
                    icon.style.transform = 'translate(0, 50%)';

                    tempMarker = new AdvancedMarkerElement({
                        map: mapRef,
                        position: {lat: event.latLng.lat(), lng: event.latLng.lng()},
                        content: icon,
                        collisionBehavior:
                            google.maps.CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL,
                    });
                }
            });
        } catch (e) {
            console.error('error instantiating click event');
            console.error(e);
        }

        event.addListener(mapRef, 'bounds_changed', function () {
            isInteracted = true;
        });

        event.addListener(mapRef, 'maptypeid_changed', function () {
            isInteracted = true;
        });

        event.addListener(mapRef, 'resize', function () {
            isInteracted = true;
        });

        event.addListener(mapRef, 'rightclick', function () {
            isInteracted = true;
        });

        // // Create the search box and link it to the UI element.
        const input = document.getElementById('pac-input') as HTMLInputElement;
        try {
            console.log('initializing search box');
            const placesLib = await $mapLoader.importLibrary('places');
            console.log(placesLib);
            const searchBox = new placesLib.SearchBox(input);

            mapRef.controls[ControlPosition.TOP_RIGHT].push(input);

            // Bias the SearchBox results towards current map's viewport.
            mapRef.addListener('bounds_changed', () => {
                searchBox.setBounds(mapRef.getBounds() as google.maps.LatLngBounds);
            });
        } catch (e) {
            console.error(e);
        }

        let isInteracted = false;
        const loadedAt = Date.now();

        navigator.geolocation.getCurrentPosition(
            position => {
                center = {lat: position.coords.latitude, lng: position.coords.longitude};
                localStorage.setItem('lastCenter', JSON.stringify(center));
                console.log(center);
                console.log('geolocation loaded in', Date.now() - loadedAt);

                if (!isInteracted && mapRef) {
                    mapRef.setCenter({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                }
            },
            position => {
                console.log(position);
            },
            {
                enableHighAccuracy: false,
                maximumAge: Infinity,
            },
        );
    });

    onDestroy(unsubscribe);

    function handleClose() {
        if (tempMarker === null) {
            return;
        }

        tempMarker.map = null;
        tempMarker = null;
    }

    async function handleSave(event: CustomEvent<CreateObjectInputs>) {
        if (!tempMarker) {
            return;
        }

        try {
            const result = await $mutation.mutateAsync(event.detail);
            permanentMarkers[`${result.data.lat}${result.data.lng}`] = result.data;
            tempMarker.gmpClickable = true;
            tempMarker.addListener('click', handleMarkerClick);
            tempMarker = null;
        } catch (error) {
            console.error($mutation.error);
            return;
        }
    }

    function handleMarkerClick({latLng}: google.maps.MapMouseEvent) {
        console.log(
            permanentMarkers[
                `${(latLng as google.maps.LatLng).lat()}${(latLng as google.maps.LatLng).lng()}`
            ],
        );
    }
</script>

{#if tempMarker !== null}
    <ObjectDetails
        initialValues={{
            lat: String(tempMarker?.position?.lat),
            lng: String(tempMarker?.position?.lng),
        }}
        on:save={handleSave}
        on:close={handleClose}
    />
{/if}

<div>
    <input id="pac-input" class="search" type="text" placeholder="Search Box" />
    <div class="full-screen" bind:this={container}></div>
    {#if mapRef}
        {#each Object.values(permanentMarkers) as marker (marker.id)}
            <Marker id={marker.id} lat={marker.lat} lng={marker.lng} />
        {/each}
    {/if}
</div>

<style>
    .full-screen {
        width: 100%;
        height: 100vh;
    }

    .search {
        margin: 16px;
        position: relative;
        right: 0;
    }
</style>
