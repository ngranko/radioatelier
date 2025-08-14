<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {mapLoader, map, markerManager, dragTimeout, activeObjectInfo} from '$lib/stores/map';
    import {createMutation} from '@tanstack/svelte-query';
    import {getLocation} from '$lib/api/location';
    import type {Location} from '$lib/interfaces/location';
    import {MarkerManager} from '$lib/services/map/markerManager';
    import {throttle} from '$lib/utils';

    interface Props {
        onClick(location: Location): void;
    }

    let {onClick}: Props = $props();

    let container: HTMLDivElement | undefined = $state();
    let isInteracted = false;
    let clickTimeout: number | undefined;
    let isClicked = false;
    let positionInterval: number | undefined;
    let isDoubleTapHold = false;
    let lastTapTime = 0;
    let tapCount = 0;

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
            // I can always enable it if I see that I need it, but for now let's leave as little controls as I can
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
            const mapInstance = new Map(container!, mapOptions);

            // Initialize marker manager for optimized rendering
            const manager = new MarkerManager({
                maxVisibleMarkers: 1000,
            });
            await manager.initialize(mapInstance, $mapLoader);
            markerManager.set(manager);

            map.update(() => mapInstance);
        } catch (e) {
            console.error('error instantiating map');
            console.error(e);
        }

        try {
            if ($map) {
                $map.getStreetView().setOptions({fullscreenControl: false, addressControl: false});
                $map.getStreetView().addListener('visible_changed', () => {
                    if ($map && !$map.getStreetView().getVisible()) {
                        activeObjectInfo.update(value => ({...value, isMinimized: false}));
                    }
                });
            }
        } catch (e) {
            console.error('error instantiating street view');
            console.error(e);
        }

        try {
            if ($map) {
                // Add bounds change listener to update marker visibility
                // TODO: should I move that to marker manager?
                event.addListener(
                    $map,
                    'bounds_changed',
                    throttle(() => {
                        if ($markerManager) {
                            $markerManager.triggerViewportUpdate();
                        }
                    }, 50),
                );

                event.addListener($map, 'click', function (event: google.maps.MapMouseEvent) {
                    isInteracted = true;

                    const domEvent = event.domEvent as MouseEvent | TouchEvent;

                    // Handle touch events for mobile
                    if (domEvent instanceof TouchEvent) {
                        const currentTime = new Date().getTime();
                        const tapLength = currentTime - lastTapTime;

                        if (tapLength < 500 && tapLength > 0) {
                            tapCount++;
                        } else {
                            tapCount = 1;
                        }
                        lastTapTime = currentTime;

                        // Single tap - add marker after delay
                        if (tapCount === 1) {
                            isClicked = false;
                            if (clickTimeout) {
                                return;
                            }

                            clickTimeout = setTimeout(() => {
                                if (tapCount === 1 && !isDoubleTapHold) {
                                    isClicked = true;
                                    onClick({
                                        lat: event.latLng?.lat() ?? 0,
                                        lng: event.latLng?.lng() ?? 0,
                                    });
                                }
                                clickTimeout = undefined;
                            }, 300);
                        }

                        // Double tap - zoom in
                        if (tapCount === 2) {
                            clearTimeout(clickTimeout);
                            clickTimeout = undefined;
                            isClicked = false;
                            isDoubleTapHold = true;

                            // Start listening for hold gesture
                            const touchStartTime = currentTime;
                            const touchStartY = domEvent.touches[0].clientY;
                            let initialZoom = $map?.getZoom() ?? 15;

                            const touchMoveHandler = (moveEvent: TouchEvent) => {
                                if (isDoubleTapHold && $map) {
                                    const currentY = moveEvent.touches[0].clientY;
                                    const deltaY = touchStartY - currentY;
                                    const zoomDelta = deltaY / 100; // Adjust sensitivity
                                    const newZoom = Math.max(
                                        1,
                                        Math.min(20, initialZoom + zoomDelta),
                                    );
                                    $map.setZoom(newZoom);
                                }
                            };

                            const touchEndHandler = () => {
                                isDoubleTapHold = false;
                                tapCount = 0;
                                document.removeEventListener('touchmove', touchMoveHandler);
                                document.removeEventListener('touchend', touchEndHandler);
                            };

                            document.addEventListener('touchmove', touchMoveHandler);
                            document.addEventListener('touchend', touchEndHandler);

                            // Reset tap count after a delay
                            setTimeout(() => {
                                tapCount = 0;
                            }, 500);
                        }
                    } else {
                        // Handle mouse events (desktop)
                        if (domEvent.detail === 1) {
                            isClicked = false;
                            if (clickTimeout) {
                                return;
                            }

                            clickTimeout = setTimeout(() => {
                                isClicked = true;
                                onClick({
                                    lat: event.latLng?.lat() ?? 0,
                                    lng: event.latLng?.lng() ?? 0,
                                });
                                clickTimeout = undefined;
                            }, 300);
                        }
                    }
                });

                event.addListener($map, 'dblclick', function (event: google.maps.MapMouseEvent) {
                    const domEvent = event.domEvent as MouseEvent | TouchEvent;

                    // Only handle mouse double-click, touch is handled above
                    if (!(domEvent instanceof TouchEvent)) {
                        if (isClicked && $map) {
                            // event.stop() doesn't work for some reason, so adding this awesome crutch
                            $map.set('disableDoubleClickZoom', true);
                            isClicked = false;
                            return;
                        }
                        clearTimeout(clickTimeout);
                        clickTimeout = undefined;
                    }
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
            }
        } catch (e) {
            console.error('error initialising map event listeners');
            console.error(e);
        }
    });

    onDestroy(() => {
        if (positionInterval) {
            clearInterval(positionInterval);
        }

        // Cleanup marker manager
        if ($markerManager) {
            $markerManager.destroy();
        }
    });

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
                if (result.state === 'granted' || result.state === 'prompt') {
                    navigator.geolocation.getCurrentPosition(
                        position => {
                            const location = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude,
                                isCurrent: true,
                            };
                            localStorage.setItem('lastPosition', JSON.stringify(location));
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
                console.error('browser permission service unavailable');
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
