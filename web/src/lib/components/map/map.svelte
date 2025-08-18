<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {
        mapLoader,
        map,
        markerManager,
        dragTimeout,
        activeObjectInfo,
        deckEnabled,
    } from '$lib/stores/map';
    import {createMutation} from '@tanstack/svelte-query';
    import {getLocation} from '$lib/api/location';
    import type {Location} from '$lib/interfaces/location';
    import {MarkerManager} from '$lib/services/map/markerManager';
    import {throttle} from '$lib/utils';
    import {pointList, searchPointList} from '$lib/stores/map';
    import {getObject} from '$lib/api/object';

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
    let suppressNextMapClick = false;
    let swallowNextDomClick = false;
    let lastDeckClickMs = 0;
    let deckOverlay: any = null; // set after dynamic import on client
    let ScatterplotLayerClass: any = null;
    let selectedDeckId: string | null = null;

    async function buildDeckLayer() {
        if (!deckOverlay || !$deckEnabled) return;
        const items = Object.values($pointList);
        const deckDataNormal = items.map(p => ({
            id: p.object.id,
            position: [Number(p.object.lng), Number(p.object.lat)],
            isVisited: p.object.isVisited,
            isRemoved: p.object.isRemoved,
            isActive: selectedDeckId === p.object.id,
            isSearch: false,
        }));
        const deckDataSearch = Object.keys($searchPointList).map(id => ({
            id,
            position: [
                Number($searchPointList[id].object.lng),
                Number($searchPointList[id].object.lat),
            ],
            isVisited: false,
            isRemoved: false,
            isActive: selectedDeckId === id,
            isSearch: true,
        }));
        const deckData = [...deckDataNormal, ...deckDataSearch];

        // Scatterplot fallback
        const layer = new ScatterplotLayerClass({
            id: 'objects-layer',
            data: deckData,
            getPosition: (d: any) => d.position,
            radiusUnits: 'pixels',
            getRadius: (d: any) => (d.isActive ? 6 : 4),
            transitions: {getRadius: {duration: 100}},
            pickable: true,
            stroked: true,
            getFillColor: (d: any) =>
                d.isRemoved ? [0, 0, 0, 128] : d.isSearch ? [220, 38, 38, 255] : [0, 0, 0, 255],
            getLineColor: (d: any) => (d.isVisited ? [16, 185, 129, 255] : [0, 0, 0, 0]),
            getLineWidth: (d: any) => (d.isVisited ? 2 : 0),
            lineWidthUnits: 'pixels',
            parameters: {depthTest: false, depthMask: false},
            onClick: async (info: any) => {
                // simulate marker click flow
                const object = info?.object;
                if (!object) return;
                // Prevent base map click handler from creating a new point
                suppressNextMapClick = true;
                swallowNextDomClick = true;
                lastDeckClickMs = Date.now();
                if (clickTimeout) {
                    clearTimeout(clickTimeout);
                    clickTimeout = undefined;
                }
                const se = info?.sourceEvent;
                try {
                    se?.stopImmediatePropagation?.();
                    se?.stopPropagation?.();
                    se?.preventDefault?.();
                } catch {}
                const id = object.id as string;
                const point = $pointList[id];
                const isSearch = object.isSearch as boolean;
                if (!point && !isSearch) return;
                selectedDeckId = id;
                buildDeckLayer();
                if (isSearch) {
                    // For search items, open with available info immediately
                    const s = $searchPointList[id].object;
                    activeObjectInfo.set({
                        isLoading: false,
                        isEditing: false,
                        isMinimized: false,
                        isDirty: false,
                        detailsId: id,
                        object: {
                            id: null,
                            name: s.name,
                            lat: s.lat,
                            lng: s.lng,
                            address: s.address,
                            city: s.city,
                            country: s.country,
                            isVisited: false,
                            isRemoved: false,
                        },
                    });
                } else {
                    activeObjectInfo.set({
                        isLoading: true,
                        isEditing: false,
                        isMinimized: false,
                        isDirty: false,
                        detailsId: id,
                        object: {
                            id,
                            lat: String(object.position[1]),
                            lng: String(object.position[0]),
                            isVisited: object.isVisited,
                            isRemoved: object.isRemoved,
                        },
                    });
                    try {
                        const payload = await getObject({queryKey: ['object', {id}]} as any);
                        activeObjectInfo.set({
                            isLoading: false,
                            isEditing: false,
                            isMinimized: false,
                            isDirty: false,
                            detailsId: payload.data.object.id,
                            object: payload.data.object,
                        });
                    } catch (e) {
                        // On error, clear loading state but keep basic info
                        activeObjectInfo.update(v => ({...v, isLoading: false}));
                    }
                }
            },
        } as any);
        deckOverlay.setProps({layers: [layer]});
    }

    // Rebuild deck layer when data or toggle changes (covers initial data load before any map move)
    $effect(() => {
        if ($deckEnabled && deckOverlay && ScatterplotLayerClass) {
            const hasData = Object.keys($pointList).length > 0;
            if (hasData) buildDeckLayer();
        }
    });
    $effect(() => {
        // If deck layer is toggled off after init, clear layers; if toggled on, force idle update soon
        if (deckOverlay && !$deckEnabled) {
            deckOverlay.setProps({layers: []});
        }
    });

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
            const {event} = await $mapLoader.importLibrary('core');
            const mapInstance = new Map(container!, mapOptions);

            // Swallow the very next native click after a deck pick (capture phase)
            const swallowClickIfNeeded = (e: Event) => {
                if (swallowNextDomClick) {
                    e.stopPropagation();
                    e.preventDefault();
                    swallowNextDomClick = false;
                }
            };
            container?.addEventListener('click', swallowClickIfNeeded, true);
            container?.addEventListener('mousedown', swallowClickIfNeeded, true);
            container?.addEventListener('mouseup', swallowClickIfNeeded, true);

            const qs = new URLSearchParams(window.location.search);
            const profiling = qs.has('profileMarkers');
            const disableLazy = qs.has('noLazy');

            const manager = new MarkerManager({
                enableProfiling: profiling,
                enableLazyLoading: !disableLazy,
            });
            await manager.initialize(mapInstance, $mapLoader);
            markerManager.set(manager);

            map.update(() => mapInstance);

            try {
                const [{GoogleMapsOverlay}, layers] = await Promise.all([
                    // @ts-ignore - local ambient module declarations
                    import('@deck.gl/google-maps'),
                    // @ts-ignore - local ambient module declarations
                    import('@deck.gl/layers'),
                ]);
                ScatterplotLayerClass = (layers as any).ScatterplotLayer;
                // interleaved: false -> use OverlayView above basemap/3D buildings
                deckOverlay = new GoogleMapsOverlay({interleaved: false});
                deckOverlay.setMap(mapInstance);
                // Build initial layer immediately and with a few fallbacks
                await buildDeckLayer();
                // Fallback timers in case the overlay view attaches after a frame
                setTimeout(buildDeckLayer, 50);
                setTimeout(buildDeckLayer, 200);
                setTimeout(buildDeckLayer, 500);
                // Also update once tiles are loaded
                event.addListener(mapInstance, 'tilesloaded', () => buildDeckLayer());
            } catch (e) {
                console.warn('Deck.gl overlay failed to initialize; continuing without it.', e);
            }

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
                // Zoom-based switching between deck scatter (low zoom) and Advanced markers (high zoom)
                const ZOOM_THRESHOLD = 10;

                // Update markers only after interactions finish
                event.addListener($map, 'idle', () => {
                    console.log($map.getZoom());

                    const currentZoom = $map?.getZoom() ?? 15;
                    const shouldUseDeck = currentZoom <= ZOOM_THRESHOLD;
                    deckEnabled.set(shouldUseDeck);

                    if ($markerManager) {
                        $markerManager.triggerViewportUpdate();
                    }

                    // Update Deck.gl layer with current points (fast WebGL rendering)
                    if (shouldUseDeck) {
                        console.log('deck activated');
                        buildDeckLayer();
                    } else if (deckOverlay) {
                        console.log('deck deactivated');
                        deckOverlay.setProps({layers: []});
                    }
                });

                event.addListener($map, 'click', function (event: google.maps.MapMouseEvent) {
                    // Hard guard: if deck is enabled and we just handled a deck click, ignore this
                    if ($deckEnabled && (suppressNextMapClick || swallowNextDomClick)) {
                        suppressNextMapClick = false;
                        swallowNextDomClick = false;
                        return;
                    }
                    if (suppressNextMapClick) {
                        suppressNextMapClick = false;
                        return;
                    }
                    if (isInZoomMode) {
                        return;
                    }

                    if (clickTapCount === 1) {
                        if (clickTimeout) {
                            return;
                        }

                        clickTimeout = setTimeout(() => {
                            // If a deck click happened recently, skip creating a new point
                            if ($deckEnabled && Date.now() - lastDeckClickMs < 500) {
                                clickTimeout = undefined;
                                return;
                            }
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
