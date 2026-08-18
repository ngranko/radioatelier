<script lang="ts">
    import StreetView from '$lib/components/map/streetView.svelte';
    import type {Location} from '$lib/interfaces/location';
    import type {MapProvider} from '$lib/interfaces/map';
    import {resolveClusteredRendererFlag} from '$lib/services/map/clusteredRendererFlag';
    import {createMarkerRenderer} from '$lib/services/map/createMarkerRenderer';
    import {
        getInitialCenter,
        startPositionPolling,
        stopPositionPolling,
    } from '$lib/services/map/geolocation';
    import {
        MAP_CLICK_DEBOUNCE_MS,
        MapClickTimeout,
        takePairedRendererClick,
    } from '$lib/services/map/mapClick';
    import {notifyFocusableMarkerShown, setFocusedTarget} from '$lib/services/map/markerFocus';
    import {MarkerManager} from '$lib/services/map/markerManager';
    import {PointerDragZoomController} from '$lib/services/map/pointerDragZoom';
    import {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
    import {mapState} from '$lib/state/map.svelte';
    import {removeDragTimeout} from '$lib/state/marker.svelte';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import {onMount, onDestroy} from 'svelte';

    interface Props {
        onClick?(location: Location): void;
    }

    let {onClick}: Props = $props();

    let container: HTMLDivElement | undefined = $state();
    const mapClickTimeout = new MapClickTimeout();
    let positionInterval: number | undefined;
    let isInZoomMode = false;
    let lastRendererInteraction: number | undefined;

    let unsubIdle: (() => void) | undefined;
    let unsubClick: (() => void) | undefined;
    let unsubDragStart: (() => void) | undefined;
    let disposeDoubleTapDragZoom: (() => void) | undefined;

    async function setupProviderAndMarkers() {
        const provider = new GoogleMapsProvider();
        const clusteredRendererEnabled = resolveClusteredRendererFlag();
        const center = await getInitialCenter();
        await provider.initialize(container!, center);
        mapState.provider = provider;
        mapState.markerManager = await initMarkerManager(provider, await clusteredRendererEnabled);
        mapState.isReady = true;
        mapState.markerManager.scheduleViewportUpdate();
    }

    function setupListenersAndGestures() {
        initListeners();

        disposeDoubleTapDragZoom = new PointerDragZoomController({
            getZoom: () => mapState.provider!.getZoom(),
            setZoom: zoom => mapState.provider!.setZoom(zoom),
            getMinZoom: () => mapState.provider!.getMinZoom(),
            getMaxZoom: () => mapState.provider!.getMaxZoom(),
            onStart: () => {
                mapClickTimeout.clear();
                isInZoomMode = true;
                mapState.provider?.setDraggable(false);
            },
            onEnd: () => {
                isInZoomMode = false;
                mapState.provider?.setDraggable(true);
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

    // Without a registered marker, setFocusedTarget cannot reach focusDetailsTarget,
    // so read position here to keep this effect subscribed to later sheet snaps.
    $effect(() => {
        void objectDetailsOverlay.position;
        setFocusedTarget(objectDetailsOverlay.detailsId || null);
    });

    async function initMarkerManager(
        provider: MapProvider,
        clusteredRendererEnabled: boolean,
    ): Promise<MarkerManager> {
        const manager = new MarkerManager(
            provider,
            createMarkerRenderer(provider, clusteredRendererEnabled, markRendererInteraction),
            {
                onMarkerShown: notifyFocusableMarkerShown,
                rendererStrategy: clusteredRendererEnabled ? 'clustered' : 'legacy',
            },
        );
        await manager.initialize();
        return manager;
    }

    function initListeners() {
        unsubIdle = mapState.provider!.onIdle(handleIdle);
        unsubClick = mapState.provider!.onClick(handleClick);
        unsubDragStart = mapState.provider!.onDragStart(handleMapDragStart);
    }

    function handleMapDragStart() {
        removeDragTimeout();
        mapClickTimeout.clear();
    }

    function handleIdle() {
        removeDragTimeout();
        persistMapView();
        mapState.markerManager?.syncRendererWithViewport();
    }

    function handleClick(latLng: {lat: number; lng: number}) {
        if (shouldIgnoreMapClick()) {
            return;
        }

        mapClickTimeout.replace(() => {
            // GPU picking is forwarded after this Maps click listener, so re-check.
            if (!shouldIgnoreMapClick() && onClick) {
                onClick(latLng);
            }
        }, MAP_CLICK_DEBOUNCE_MS);
    }

    function shouldIgnoreMapClick(): boolean {
        const manager = mapState.markerManager;
        const legacyDeckMode = Boolean(manager?.isDeckRenderer && !manager.isClusteredRenderer);
        if (legacyDeckMode || isInZoomMode) {
            return true;
        }
        return consumeRendererInteraction();
    }

    function consumeRendererInteraction(): boolean {
        if (!mapState.markerManager?.isClusteredRenderer) {
            return false;
        }
        const paired = takePairedRendererClick(lastRendererInteraction, performance.now());
        lastRendererInteraction = undefined;
        return paired;
    }

    function markRendererInteraction() {
        lastRendererInteraction = performance.now();
        if (mapClickTimeout.clear()) {
            lastRendererInteraction = undefined;
        }
    }

    function persistMapView() {
        const center = mapState.provider?.getCenter();
        if (!center) {
            return;
        }
        localStorage.setItem(
            'lastCenter',
            JSON.stringify({
                lat: center.lat,
                lng: center.lng,
                zoom: mapState.provider?.getZoom() ?? 15,
            }),
        );
    }

    onDestroy(() => {
        if (positionInterval) {
            stopPositionPolling(positionInterval);
        }

        unsubIdle?.();
        unsubClick?.();
        unsubDragStart?.();
        disposeDoubleTapDragZoom?.();
        mapClickTimeout.clear();
        mapState.markerManager?.destroy();
        mapState.provider?.destroy();
        mapState.provider = null;
        mapState.isReady = false;
    });
</script>

<div class="h-dvh w-full touch-none" bind:this={container}></div>
<StreetView />
