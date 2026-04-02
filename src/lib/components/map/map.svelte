<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {mapState} from '$lib/state/map.svelte';
    import type {MapProvider} from '$lib/interfaces/map';
    import type {Location} from '$lib/interfaces/location';
    import {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
    import {MarkerManager} from '$lib/services/map/markerManager';
    import {DomMarkerRenderer} from '$lib/services/map/renderer/domMarkerRenderer';
    import {HybridMarkerRenderer} from '$lib/services/map/providers/google/hybridMarkerRenderer';
    import {
        getInitialCenter,
        startPositionPolling,
        stopPositionPolling,
    } from '$lib/services/map/geolocation';
    import {PointerDragZoomController} from '$lib/services/map/pointerDragZoom';
    import config from '$lib/config';
    import StreetView from '$lib/components/map/streetView.svelte';
    import {removeDragTimeout} from '$lib/state/marker.svelte';

    interface Props {
        onClick?(location: Location): void;
    }

    let {onClick}: Props = $props();

    let container: HTMLDivElement | undefined = $state();
    let clickTimeout: ReturnType<typeof setTimeout> | undefined;
    let positionInterval: number | undefined;
    let isInZoomMode = false;

    let unsubIdle: (() => void) | undefined;
    let unsubClick: (() => void) | undefined;
    let unsubCenterChanged: (() => void) | undefined;

    async function setupProviderAndMarkers() {
        const provider = new GoogleMapsProvider();
        const center = await getInitialCenter();
        await provider.initialize(container!, center);
        mapState.provider = provider;
        mapState.markerManager = await initMarkerManager(provider);
        mapState.deckEnabled = mapState.markerManager.isDeckRenderer;
        mapState.isReady = true;
        mapState.markerManager.scheduleViewportUpdate();
    }

    function setupListenersAndGestures() {
        initListeners();

        new PointerDragZoomController({
            getZoom: () => mapState.provider!.getZoom(),
            setZoom: zoom => mapState.provider!.setZoom(zoom),
            getMinZoom: () => mapState.provider!.getMinZoom(),
            getMaxZoom: () => mapState.provider!.getMaxZoom(),
            onStart: () => {
                clearTimeout(clickTimeout);
                clickTimeout = undefined;
                isInZoomMode = true;
            },
            onEnd: () => {
                isInZoomMode = false;
            },
        }).attachDoubleTapDragZoom(container!);
    }

    onMount(async () => {
        positionInterval = startPositionPolling(5000);

        try {
            await setupProviderAndMarkers();
        } catch (e) {
            console.error('error instantiating map');
            console.error(e);
        }

        try {
            setupListenersAndGestures();
        } catch (e) {
            console.error('error initialising map event listeners');
            console.error(e);
        }
    });

    async function initMarkerManager(provider: MapProvider): Promise<MarkerManager> {
        const initialMode = shouldUseDeck(provider) ? 'deck' : 'dom';
        const manager = new MarkerManager(
            provider,
            mode =>
                mode === 'deck'
                    ? new HybridMarkerRenderer(provider)
                    : new DomMarkerRenderer(provider),
            {renderer: initialMode},
        );
        await manager.initialize();
        return manager;
    }

    function initListeners() {
        unsubIdle = mapState.provider!.onIdle(handleIdle);
        unsubClick = mapState.provider!.onClick(handleClick);
        unsubCenterChanged = mapState.provider!.onCenterChanged(handleCenterChanged);
    }

    function handleIdle() {
        mapState.markerManager?.setRendererMode(shouldUseDeck(mapState.provider!) ? 'deck' : 'dom');
        mapState.deckEnabled = mapState.markerManager?.isDeckRenderer ?? false;
        mapState.markerManager?.scheduleViewportUpdate();
    }

    function handleClick(latLng: {lat: number; lng: number}) {
        if (mapState.deckEnabled || isInZoomMode) {
            return;
        }

        clickTimeout = setTimeout(() => {
            if (!isInZoomMode && onClick) {
                onClick(latLng);
            }
            clickTimeout = undefined;
        }, 300);
    }

    function handleCenterChanged(center: {lat: number; lng: number}, zoom: number) {
        removeDragTimeout();

        localStorage.setItem(
            'lastCenter',
            JSON.stringify({lat: center.lat, lng: center.lng, zoom}),
        );
    }

    function shouldUseDeck(provider: MapProvider): boolean {
        return provider.getZoom() <= config.deckZoomThreshold;
    }

    onDestroy(() => {
        if (positionInterval) {
            stopPositionPolling(positionInterval);
        }

        unsubIdle?.();
        unsubClick?.();
        unsubCenterChanged?.();
        mapState.markerManager?.destroy();
        mapState.provider?.destroy();
        mapState.provider = null;
        mapState.deckEnabled = false;
        mapState.isReady = false;
    });
</script>

<div class="h-dvh w-full touch-none" bind:this={container}></div>
<StreetView />
