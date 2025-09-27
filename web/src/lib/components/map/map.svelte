<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {mapLoader, map, markerManager, dragTimeout, deckEnabled} from '$lib/stores/map';
    import {createMutation} from '@tanstack/svelte-query';
    import {getLocation} from '$lib/api/location';
    import type {Location} from '$lib/interfaces/location';
    import {MarkerManager} from '$lib/services/map/markerManager';
    import {pointList} from '$lib/stores/map';
    import {DeckOverlayController, type DeckItem} from '$lib/services/map/deckOverlay';
    import {computeDeckItems, initDeckOverlay, shouldUseDeck} from '$lib/services/map/deckOverlayManager.svelte';
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

    onMount(async () => {
        positionInterval = startPositionPolling(5000);

        const {event} = await $mapLoader.importLibrary('core');

        try {
            const mapInstance = await initMap();
            markerManager.set(await initMarkerManager(mapInstance));
            map.set(mapInstance);
            deckController = await initDeckOverlay();

            // Trigger initial viewport update once when the map first becomes idle
            event.addListenerOnce(mapInstance, 'idle', () => {
                if ($markerManager && $map && !$deckEnabled) {
                    $markerManager.triggerViewportUpdate();
                }
            });
        } catch (e) {
            console.error('error instantiating map');
            console.error(e);
        }

        try {
            initListeners();

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
        } catch (e) {
            console.error('error initialising map event listeners');
            console.error(e);
        }
    });

    async function initMap(): Promise<google.maps.Map> {
        const {Map} = await $mapLoader.importLibrary('maps');

        const center = await getInitialCenter($location);

        const mapInstance = new Map(container!, {
            zoom: center.zoom ?? 15,
            center,
            mapId: config.googleMapsId,
            controlSize: 40,
            mapTypeControl: false,
            cameraControl: false,
            fullscreenControl: false,
            zoomControl: false,
            clickableIcons: false,
        });

        return mapInstance;
    }

    async function initMarkerManager(mapInstance: google.maps.Map): Promise<MarkerManager> {
        const qs = new URLSearchParams(window.location.search);

        const disableLazy = qs.has('noLazy');

        const manager = new MarkerManager({
            enableLazyLoading: !disableLazy,
        });
        await manager.initialize(mapInstance, $mapLoader);
        return manager;
    }

    function initListeners() {
        if (!$map) {
            return;
        }

        google.maps.event.addListener($map, 'idle', handleIdle);
        google.maps.event.addListener($map, 'click', handleClick);
        google.maps.event.addListener($map, 'center_changed', handleCenterChanged);
    }

    function handleIdle() {
        if (shouldUseDeck($map!) && !$deckEnabled && deckController) {
            $markerManager?.hideAllImmediately();
            deckController.setEnabled(true);
            deckController.rebuild(computeDeckItems($pointList));
        }

        if (!shouldUseDeck($map!)) {
            deckController?.setEnabled(false);
            $markerManager?.triggerViewportUpdate();
        }
    }

    function handleClick(event: google.maps.MapMouseEvent) {
        if ($deckEnabled || isInZoomMode) {
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
    }

    function handleCenterChanged() {
        if (!$map) {
            return;
        }

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
    }

    function cleanupListeners() {
        if (!$map) {
            return;
        }

        google.maps.event.clearInstanceListeners($map);
    }

    onDestroy(() => {
        if (positionInterval) {
            stopPositionPolling(positionInterval);
        }

        cleanupListeners();
        $markerManager?.destroy();
        deckController?.destroy();
        map.set(undefined);
    });
</script>

<div class="h-dvh w-full touch-none" bind:this={container}></div>
<StreetView />
