<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {mapLoader, map, markerManager, dragTimeout, deckEnabled} from '$lib/stores/map';
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
    import config from '$lib/config';
    import StreetView from './streetView.svelte';

    interface Props {
        onClick(location: Location): void;
    }

    let {onClick}: Props = $props();

    let container: HTMLDivElement | undefined = $state();
    let clickTimeout: number | undefined;
    let positionInterval: number | undefined;
    let isInZoomMode = false;

    let deckController: DeckOverlayController | null = null;

    const location = createMutation({
        mutationFn: getLocation,
    });

    function computeDeckItems(): DeckItem[] {
        const items = Object.values($pointList).map(p => ({
            id: p.object.id,
            position: [Number(p.object.lng), Number(p.object.lat)] as [number, number],
            isVisited: p.object.isVisited,
            isRemoved: p.object.isRemoved,
            isSearch: false,
        }));
        return [...items];
    }

    onMount(async () => {
        positionInterval = startPositionPolling(5000);

        const {Map} = await $mapLoader.importLibrary('maps');
        const {event} = await $mapLoader.importLibrary('core');

        const center = await getInitialCenter($location);
        const qs = new URLSearchParams(window.location.search);

        const mapOptions: google.maps.MapOptions = {
            zoom: center.zoom ?? 15,
            center,
            mapId: config.googleMapsId,
            controlSize: 40,
            mapTypeControl: false,
            cameraControl: false,
            fullscreenControl: false,
            zoomControl: false,
            clickableIcons: false,
        };

        try {
            const mapInstance = new Map(container!, mapOptions);

            const disableLazy = qs.has('noLazy');

            const manager = new MarkerManager({
                enableLazyLoading: !disableLazy,
            });
            await manager.initialize(mapInstance, $mapLoader);
            markerManager.set(manager);

            map.update(() => mapInstance);

            await initDeckOverlay();

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
                event.addListener($map, 'idle', () => {
                    if (shouldUseDeck() && !$deckEnabled && deckController) {
                        $markerManager?.hideAllImmediately();
                        deckController?.setEnabled(true);
                        deckController?.rebuild(computeDeckItems());
                    }

                    if (!shouldUseDeck()) {
                        deckController?.setEnabled(false);
                        $markerManager?.triggerViewportUpdate();
                    }
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

    async function initDeckOverlay() {
        if (!$map || !$markerManager) {
            console.log('map or marker manager is not set, cannot init deck');
            return;
        }

        try {
            const controller = new DeckOverlayController($map!);
            await controller.init();
            deckController = controller;
            if (shouldUseDeck()) {
                // Ensure DOM markers are not visible when entering Deck mode on init
                $markerManager.hideAllImmediately();
                deckController.setEnabled(true);
                deckController.rebuild(computeDeckItems());
                // Ensure a single update after the first idle when overlay view is attached
                google.maps.event.addListenerOnce($map, 'idle', () =>
                    deckController?.rebuild(computeDeckItems()),
                );
            }
        } catch (e) {
            deckController = null;
            deckEnabled.set(false);
            console.warn('Deck.gl overlay failed to initialize; continuing without it.', e);
        }
    }

    function shouldUseDeck(): boolean {
        return ($map?.getZoom() ?? 15) <= config.deckZoomThreshold;
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
        map.set(undefined);
    });
</script>

<div class="h-dvh w-full touch-none" bind:this={container}></div>
<StreetView />
