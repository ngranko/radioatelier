<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {mapState} from '$lib/state/map.svelte';
    import type {Location} from '$lib/interfaces/location';
    import {MarkerManager} from '$lib/services/map/markerManager';
    import {DomMarkerRenderer} from '$lib/services/map/renderer/domMarkerRenderer';
    import {
        HybridMarkerRenderer,
    } from '$lib/services/map/providers/google/hybridMarkerRenderer';
    import {
        getInitialCenter,
        startPositionPolling,
        stopPositionPolling,
    } from '$lib/services/map/geolocation';
    import {PointerDragZoomController} from '$lib/services/map/pointerDragZoom';
    import config from '$lib/config';
    import StreetView from './streetView.svelte';
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

    onMount(async () => {
        positionInterval = startPositionPolling(5000);

        try {
            const center = await getInitialCenter();
            await mapState.provider.initialize(container!, center);
            mapState.markerManager = await initMarkerManager();
            mapState.isReady = true;
            mapState.markerManager.scheduleViewportUpdate();
        } catch (e) {
            console.error('error instantiating map');
            console.error(e);
        }

        try {
            initListeners();

            new PointerDragZoomController({
                getZoom: () => mapState.provider.getZoom(),
                setZoom: zoom => mapState.provider.setZoom(zoom),
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

    async function initMarkerManager(): Promise<MarkerManager> {
        const provider = mapState.provider;
        const initialMode = shouldUseDeck() ? 'deck' : 'dom';
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
        unsubIdle = mapState.provider.onIdle(handleIdle);
        unsubClick = mapState.provider.onClick(handleClick);
        unsubCenterChanged = mapState.provider.onCenterChanged(handleCenterChanged);
    }

    function handleIdle() {
        const mode = mapState.markerManager?.setRendererMode(shouldUseDeck() ? 'deck' : 'dom');
        mapState.deckEnabled = mode === 'deck';
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

    function shouldUseDeck(): boolean {
        return mapState.provider.getZoom() <= config.deckZoomThreshold;
    }

    onDestroy(() => {
        if (positionInterval) {
            stopPositionPolling(positionInterval);
        }

        unsubIdle?.();
        unsubClick?.();
        unsubCenterChanged?.();
        mapState.markerManager?.destroy();
        mapState.provider.destroy();
        mapState.isReady = false;
    });
</script>

<div class="h-dvh w-full touch-none" bind:this={container}></div>
<StreetView />
