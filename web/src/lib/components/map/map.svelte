<script lang="ts">
    import {onMount, createEventDispatcher} from 'svelte';
    import {mapLoader, map} from '$lib/stores/map';
    import {createMutation} from '@tanstack/svelte-query';
    import {getLocation} from '$lib/api/location';
    import type {Location} from '$lib/interfaces/location';

    let container: HTMLDivElement;
    let isInteracted = false;
    const loadedAt = Date.now();
    let clickTimeout: number | undefined;
    let isClicked = false;

    const dispatch = createEventDispatcher();

    const location = createMutation({
        mutationFn: getLocation,
    });

    onMount(async () => {
        const {ControlPosition, event} = await $mapLoader.importLibrary('core');

        const center = await getCenter();

        const mapOptions: google.maps.MapOptions = {
            zoom: 15,
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
            clickableIcons: false,
        };

        try {
            const {Map} = await $mapLoader.importLibrary('maps');
            map.update(() => new Map(container, mapOptions));
        } catch (e) {
            console.error('error instantiating map');
            console.error(e);
        }

        try {
            event.addListener($map, 'click', function (event: google.maps.MapMouseEvent) {
                isInteracted = true;

                if ((event.domEvent as MouseEvent | TouchEvent).detail === 1) {
                    isClicked = false;
                    if (clickTimeout) {
                        return;
                    }

                    clickTimeout = setTimeout(() => {
                        isClicked = true;
                        dispatch('click', {lat: event.latLng?.lat(), lng: event.latLng?.lng()});
                        clickTimeout = undefined;
                    }, 200);
                }
            });

            event.addListener($map, 'dblclick', function () {
                if (isClicked) {
                    // event.stop() doesn't work for some reason, so adding this awesome crutch
                    $map.set('disableDoubleClickZoom', true);
                    isClicked = false;
                    return;
                }
                clearTimeout(clickTimeout);
                clickTimeout = undefined;
            });

            event.addListener($map, 'bounds_changed', function () {
                isInteracted = true;
            });

            event.addListener($map, 'maptypeid_changed', function () {
                isInteracted = true;
            });

            event.addListener($map, 'resize', function () {
                isInteracted = true;
            });

            event.addListener($map, 'rightclick', function () {
                isInteracted = true;
            });
        } catch (e) {
            console.error('error initialising map event listeners');
            console.error(e);
        }

        updateCurrentPosition();
    });

    async function getCenter(): Promise<Location> {
        if (localStorage.getItem('lastCenter')) {
            return JSON.parse(localStorage.getItem('lastCenter') as string);
        }

        try {
            const result = await $location.mutateAsync();
            return result.location ?? {lat: 0, lng: 0};
        } catch (e) {
            console.error('error getting location');
            console.error(e);
        }

        return {lat: 0, lng: 0};
    }

    function updateCurrentPosition() {
        navigator.geolocation.getCurrentPosition(
            position => {
                const center = {lat: position.coords.latitude, lng: position.coords.longitude};
                localStorage.setItem('lastCenter', JSON.stringify(center));
                console.log(center);
                console.log('geolocation loaded in', Date.now() - loadedAt);

                if (!isInteracted && $map) {
                    $map.setCenter({
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
    }
</script>

<div class="map" bind:this={container}></div>

<style>
    .map {
        width: 100%;
        height: 100dvh;
    }
</style>
