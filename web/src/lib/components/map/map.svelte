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
    let clickTimeout: number | undefined;
    let positionInterval: number | undefined;
    let lastClickTapTime = 0;
    let clickTapCount = 0;
    let isInZoomMode = false;

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
            const manager = new MarkerManager();
            await manager.initialize(mapInstance, $mapLoader);
            markerManager.set(manager);

            map.update(() => mapInstance);

            // Trigger initial viewport update to show markers
            // Use multiple fallbacks to ensure markers are shown
            const triggerInitialUpdate = () => {
                if (manager && $map && $map.getBounds()) {
                    manager.triggerViewportUpdate();
                }
            };

            // TODO (@nikita): this is a hack to fix the map not showing up on the first load, come up with a better solution
            // Try immediately
            triggerInitialUpdate();

            // Try after a short delay
            setTimeout(triggerInitialUpdate, 100);

            // Try after map is fully loaded
            setTimeout(triggerInitialUpdate, 500);

            // Try after a longer delay as final fallback
            setTimeout(triggerInitialUpdate, 1000);
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
                    if (isInZoomMode) {
                        return;
                    }

                    if (clickTapCount === 1) {
                        if (clickTimeout) {
                            return;
                        }

                        clickTimeout = setTimeout(() => {
                            if (clickTapCount === 1 && !isInZoomMode) {
                                onClick({
                                    lat: event.latLng?.lat() ?? 0,
                                    lng: event.latLng?.lng() ?? 0,
                                });
                            }
                            clickTimeout = undefined;
                        }, 300);
                    }
                });

                document.addEventListener('mousedown', event => {
                    const currentTime = Date.now();

                    // Check if this is a double-click
                    if (currentTime - lastClickTapTime < 300) {
                        clickTapCount++;

                        if (clickTapCount === 2) {
                            // Clear any pending marker creation
                            clearTimeout(clickTimeout);
                            clickTimeout = undefined;

                            // Start zoom mode immediately
                            isInZoomMode = true;

                            let initialY = event.clientY;
                            let initialZoom = $map?.getZoom() ?? 15;

                            const mouseMoveHandler = throttle((moveEvent: MouseEvent) => {
                                if (moveEvent.buttons === 1 && isInZoomMode && $map) {
                                    updateZoomLevel(initialY, moveEvent.clientY, initialZoom);
                                }
                            }, 16); // ~60fps (1000ms / 60fps = ~16ms)

                            const mouseUpHandler = () => {
                                isInZoomMode = false;
                                document.removeEventListener('mousemove', mouseMoveHandler);
                                document.removeEventListener('mouseup', mouseUpHandler);
                            };

                            document.addEventListener('mousemove', mouseMoveHandler);
                            document.addEventListener('mouseup', mouseUpHandler);

                            // Reset click count
                            clickTapCount = 0;
                        }
                    } else {
                        clickTapCount = 1;
                    }

                    lastClickTapTime = currentTime;
                });

                document.addEventListener(
                    'touchstart',
                    event => {
                        // Only handle if it's a single touch
                        if (event.touches.length === 1) {
                            const currentTime = new Date().getTime();

                            if (currentTime - lastClickTapTime < 500) {
                                clickTapCount++;

                                // Double tap detected - start listening for hold gesture
                                if (clickTapCount === 2) {
                                    clearTimeout(clickTimeout);
                                    clickTimeout = undefined;

                                    isInZoomMode = true;

                                    let initialY = event.touches[0].clientY;
                                    let initialZoom = $map?.getZoom() ?? 15;

                                    const touchMoveHandler = throttle((moveEvent: TouchEvent) => {
                                        if (isInZoomMode && $map) {
                                            // Prevent default map dragging
                                            moveEvent.preventDefault();
                                            moveEvent.stopPropagation();

                                            updateZoomLevel(
                                                initialY,
                                                moveEvent.touches[0].clientY,
                                                initialZoom,
                                            );
                                        }
                                    }, 16); // ~60fps

                                    const touchEndHandler = () => {
                                        isInZoomMode = false;
                                        clickTapCount = 0;
                                        document.removeEventListener('touchmove', touchMoveHandler);
                                        document.removeEventListener('touchend', touchEndHandler);

                                        // Reset zoom mode state after a delay to prevent interference
                                        setTimeout(() => {
                                            isInZoomMode = false;
                                        }, 100);
                                    };

                                    document.addEventListener('touchmove', touchMoveHandler);
                                    document.addEventListener('touchend', touchEndHandler);

                                    // Reset tap count after a delay
                                    setTimeout(() => {
                                        clickTapCount = 0;
                                    }, 500);
                                }
                            } else {
                                clickTapCount = 1;
                            }
                            lastClickTapTime = currentTime;
                        }
                    },
                    {passive: true},
                );

                function updateZoomLevel(initialY: number, currentY: number, initialZoom: number) {
                    if (!$map) {
                        return;
                    }

                    const deltaY = initialY - currentY;
                    const zoomDelta = deltaY / 50;
                    const newZoom = Math.max(1, Math.min(20, initialZoom + zoomDelta));

                    $map.setZoom(newZoom);
                }

                event.addListener($map, 'center_changed', function () {
                    dragTimeout.remove();

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
