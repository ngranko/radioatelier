<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {dragTimeout} from '$lib/stores/map';
    import {mapState} from '$lib/state/map.svelte';
    import {createMutation} from '@tanstack/svelte-query';
    import {getLocation} from '$lib/api/location';
    import type {Location} from '$lib/interfaces/location';
    import {MarkerManager} from '$lib/services/map/markerManager';
    import {pointList} from '$lib/stores/map';
    import {DeckOverlayController} from '$lib/services/map/deckOverlay';
    import {
        computeDeckItems,
        initDeckOverlay,
        shouldUseDeck,
    } from '$lib/services/map/deckOverlayManager.svelte';
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

        try {
            const mapInstance = await initMap();
            mapState.markerManager = await initMarkerManager(mapInstance);
            mapState.map = mapInstance;
            deckController = await initDeckOverlay();
            if (!mapState.deckEnabled) {
                mapState.markerManager!.scheduleViewportUpdate();
            }
        } catch (e) {
            console.error('error instantiating map');
            console.error(e);
        }

        try {
            initListeners();

            new PointerDragZoomController({
                getZoom: () => mapState.map?.getZoom() ?? 15,
                setZoom: zoom => mapState.map?.setZoom(zoom),
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
        const {Map} = await mapState.loader.importLibrary('maps');

        const center = await getInitialCenter($location);

        return new Map(container!, {
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
    }

    async function initMarkerManager(mapInstance: google.maps.Map): Promise<MarkerManager> {
        const manager = new MarkerManager();
        await manager.initialize(mapInstance, mapState.loader);
        return manager;
    }

    function initListeners() {
        if (!mapState.map) {
            return;
        }

        google.maps.event.addListener(mapState.map, 'idle', handleIdle);
        google.maps.event.addListener(mapState.map, 'click', handleClick);
        google.maps.event.addListener(mapState.map, 'center_changed', handleCenterChanged);
    }

    function handleIdle() {
        if (shouldUseDeck(mapState.map!) && !mapState.deckEnabled && deckController) {
            mapState.markerManager?.disableMarkers();
            deckController.setEnabled(true);
            deckController.rebuild(computeDeckItems($pointList));
            mapState.deckEnabled = true;
        }

        if (!shouldUseDeck(mapState.map!) || !deckController) {
            deckController?.setEnabled(false);
            mapState.markerManager?.enableMarkers();
            mapState.markerManager?.scheduleViewportUpdate();
            mapState.deckEnabled = false;
        }
    }

    function handleClick(event: google.maps.MapMouseEvent) {
        if (mapState.deckEnabled || isInZoomMode) {
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
        if (!mapState.map) {
            return;
        }

        dragTimeout.remove();

        const center = mapState.map.getCenter();
        localStorage.setItem(
            'lastCenter',
            JSON.stringify({
                lat: (center as google.maps.LatLng).lat(),
                lng: (center as google.maps.LatLng).lng(),
                zoom: mapState.map.getZoom(),
            }),
        );
    }

    function cleanupListeners() {
        if (!mapState.map) {
            return;
        }

        google.maps.event.clearInstanceListeners(mapState.map);
    }

    onDestroy(() => {
        if (positionInterval) {
            stopPositionPolling(positionInterval);
        }

        cleanupListeners();
        mapState.markerManager?.destroy();
        deckController?.destroy();
        mapState.map = undefined;
    });
</script>

<div class="h-dvh w-full touch-none" bind:this={container}></div>
<StreetView />
