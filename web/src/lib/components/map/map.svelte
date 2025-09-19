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
    import {pointList} from '$lib/stores/map';
    import {DeckOverlayController, type DeckItem} from '$lib/services/map/deckOverlay';
    import {
        getInitialCenter,
        startPositionPolling,
        stopPositionPolling,
    } from '$lib/services/map/geolocation';
    import {PointerDragZoomController} from '$lib/services/map/pointerDragZoom';

    interface Props {
        onClick(location: Location): void;
    }

    let {onClick}: Props = $props();

    let container: HTMLDivElement | undefined = $state();
    let clickTimeout: number | undefined;
    let positionInterval: number | undefined;
    let isInZoomMode = false;
    let selectedDeckId: string | null = null;

    let deckController: DeckOverlayController | null = null;
    const DECK_ZOOM_THRESHOLD = 10;

    const location = createMutation({
        mutationFn: getLocation,
    });

    function computeDeckItems(): DeckItem[] {
        const items = Object.values($pointList).map(p => ({
            id: p.object.id,
            position: [Number(p.object.lng), Number(p.object.lat)] as [number, number],
            isVisited: p.object.isVisited,
            isRemoved: p.object.isRemoved,
            isActive: selectedDeckId === p.object.id,
            isSearch: false,
        }));
        return [...items];
    }

    // Rebuild deck layer when data or toggle changes (covers initial data load before any map move)
    $effect(() => {
        if ($deckEnabled && deckController?.isReady()) {
            const hasData = Object.keys($pointList).length > 0;
            if (hasData) {
                deckController.rebuild(computeDeckItems());
            }
        } else if (deckController && !$deckEnabled) {
            deckController.setEnabled(false);
        }
    });

    onMount(async () => {
        positionInterval = startPositionPolling(5000);

        const {Map} = await $mapLoader.importLibrary('maps');
        const {ControlPosition, event} = await $mapLoader.importLibrary('core');

        const center = await getInitialCenter($location);

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
            const mapInstance = new Map(container!, mapOptions);

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
                deckController = new DeckOverlayController(mapInstance);
                await deckController.init();
                if (shouldUseDeck()) {
                    deckController.setEnabled(true);
                    deckController.rebuild(computeDeckItems());
                    // Ensure a single update after the first idle when overlay view is attached
                    event.addListenerOnce(mapInstance, 'idle', () =>
                        deckController?.rebuild(computeDeckItems()),
                    );
                }
            } catch (e) {
                console.warn('Deck.gl overlay failed to initialize; continuing without it.', e);
            }

            // Trigger initial viewport update once when the map first becomes idle
            event.addListenerOnce(mapInstance, 'idle', () => {
                if (manager && $map) {
                    manager.triggerViewportUpdate();
                }
            });
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
                event.addListener($map, 'idle', () => {
                    if (shouldUseDeck()) {
                        if (!$deckEnabled) {
                            deckController?.setEnabled(true);
                            deckController?.rebuild(computeDeckItems());
                        }
                    } else {
                        deckController?.setEnabled(false);
                        $markerManager?.triggerViewportUpdate();
                    }
                    deckEnabled.set(shouldUseDeck());
                });

                event.addListener($map, 'click', function (event: google.maps.MapMouseEvent) {
                    // if deck is enabled then we are quite zoomed out, so there's no need to allow marker creation
                    // as it will just lead to more complexity on marker handler (we create a marker as a dom marker,
                    // but immediately need to transfer it to deck)
                    if ($deckEnabled) {
                        return;
                    }
                    if (isInZoomMode) {
                        return;
                    }

                    clickTimeout = setTimeout(() => {
                        if (!isInZoomMode) {
                            onClick({
                                lat: event.latLng?.lat() ?? 0,
                                lng: event.latLng?.lng() ?? 0,
                            });
                        }
                        clickTimeout = undefined;
                    }, 300);
                });

                new PointerDragZoomController({
                    getZoom: () => $map?.getZoom() ?? 15,
                    setZoom: zoom => $map?.setZoom(zoom),
                    onStart: () => {
                        clearTimeout(clickTimeout);
                        clickTimeout = undefined;
                        isInZoomMode = true;
                    },
                    onEnd: () => {
                        isInZoomMode = false;
                    },
                }).attachDoubleTapDragZoom(container!);

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

    function shouldUseDeck(): boolean {
        return ($map?.getZoom() ?? 15) <= DECK_ZOOM_THRESHOLD;
    }

    onDestroy(() => {
        if (positionInterval) {
            stopPositionPolling(positionInterval);
        }

        // Cleanup marker manager
        if ($markerManager) {
            $markerManager.destroy();
        }
        deckController?.destroy();
    });
</script>

<div class="h-dvh w-full touch-none" bind:this={container}></div>
