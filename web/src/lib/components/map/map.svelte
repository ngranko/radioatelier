<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {
        mapLoader,
        map,
        dragTimeout,
        activeObjectInfo,
        pointList,
        searchPointList,
    } from '$lib/stores/map';
    import {createMutation} from '@tanstack/svelte-query';
    import {getLocation} from '$lib/api/location';
    import type {Location} from '$lib/interfaces/location';

    interface Props {
        onClick(location: Location): void;
    }

    let {onClick}: Props = $props();

    let container: HTMLDivElement | undefined = $state();
    let isInteracted = false;
    let clickTimeout: number | undefined;
    let isClicked = false;
    let positionInterval: number | undefined;
    let boundTimeout: number | undefined;

    const location = createMutation({
        mutationFn: getLocation,
    });

    onMount(async () => {
        updateCurrentPosition();
        positionInterval = setInterval(updateCurrentPosition, 5000);

        const {ControlPosition, event} = await $mapLoader.importLibrary('core');

        const center = await getCenter();

        const mapOptions: google.maps.MapOptions = {
            zoom: center.zoom ?? 15,
            center,
            mapId: '5b6e83dfb8822236',
            controlSize: 40,
            // I can always enable it if I see that I need it< but for now let's leave as little controls as I can
            mapTypeControl: false,
            cameraControl: false,
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
            map.update(() => new Map(container!, mapOptions));
        } catch (e) {
            console.error('error instantiating map');
            console.error(e);
        }

        try {
            $map.getStreetView().setOptions({fullscreenControl: false, addressControl: false});
            $map.getStreetView().addListener('visible_changed', () => {
                if (!$map.getStreetView().getVisible()) {
                    activeObjectInfo.update(value => ({...value, isMinimized: false}));
                }
            });
        } catch (e) {
            console.error('error instantiating street view');
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
                        onClick({lat: event.latLng?.lat() ?? 0, lng: event.latLng?.lng() ?? 0});
                        clickTimeout = undefined;
                    }, 300);
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
                if (boundTimeout) {
                    clearTimeout(boundTimeout);
                }
                boundTimeout = setTimeout(() => {
                    redrawMarkers();
                }, 300);
                dragTimeout.remove();
                isInteracted = true;
            });

            event.addListener($map, 'center_changed', function () {
                dragTimeout.remove();
                isInteracted = true;

                const center = $map.getCenter();
                localStorage.setItem(
                    'lastCenter',
                    JSON.stringify({
                        lat: (center as google.maps.LatLng).lat(),
                        lng: (center as google.maps.LatLng).lng(),
                        zoom: $map.getZoom(),
                    }),
                );
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
    });

    onDestroy(() => {
        if (positionInterval) {
            clearInterval(positionInterval);
        }
    });

    function redrawMarkers() {
        if (!$map.getBounds()) {
            return;
        }

        for (const point of Object.values($pointList)) {
            if (
                !($map.getBounds() as google.maps.LatLngBounds).contains({
                    lat: Number(point.object.lat),
                    lng: Number(point.object.lng),
                })
            ) {
                point.marker!.map = null;
            } else {
                if (!$searchPointList[point.object.id]) {
                    point.marker!.map = $map;
                }
            }
        }
    }

    async function getCenter(): Promise<Location> {
        if (localStorage.getItem('lastCenter')) {
            return JSON.parse(localStorage.getItem('lastCenter') as string);
        }

        if (localStorage.getItem('lastPosition')) {
            return JSON.parse(localStorage.getItem('lastPosition') as string);
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
        navigator.permissions.query({name: 'geolocation'}).then(
            result => {
                console.log(result.state);
                if (result.state === 'granted' || result.state === 'prompt') {
                    navigator.geolocation.getCurrentPosition(
                        position => {
                            const location = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                                isCurrent: true,
                            };
                            localStorage.setItem('lastPosition', JSON.stringify(location));

                            if (!isInteracted && $map) {
                                $map.setCenter({
                                    lat: position.coords.latitude,
                                    lng: position.coords.longitude,
                                });
                            }
                        },
                        error => {
                            console.error(error);
                            if (localStorage.getItem('lastPosition')) {
                                const location = JSON.parse(
                                    localStorage.getItem('lastPosition') as string,
                                );
                                location.isCurrent = false;
                                localStorage.setItem('lastPosition', JSON.stringify(location));
                            }
                        },
                        {
                            enableHighAccuracy: false,
                            timeout: 5000,
                        },
                    );
                } else {
                    console.error(
                        'geolocation is not granted, browser location services are disabled',
                    );
                }
            },
            error => {
                console.log('browser permission service unavailable');
                console.error(error);
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
