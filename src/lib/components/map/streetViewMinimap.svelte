<script lang="ts">
    import {onDestroy, tick} from 'svelte';
    import config from '$lib/config';
    import {cn} from '$lib/utils';
    import Button from '$lib/components/ui/button/button.svelte';
    import {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
    import {
        applyStreetViewLocation,
        resolveStreetViewLocation,
    } from '$lib/services/map/streetView.svelte';
    import {mapState} from '$lib/state/map.svelte';
    import Maximize2Icon from '@lucide/svelte/icons/maximize-2';
    import Minimize2Icon from '@lucide/svelte/icons/minimize-2';

    interface Props {
        panorama: google.maps.StreetViewPanorama | null;
        visible: boolean;
    }

    let {panorama, visible}: Props = $props();

    let miniMapContainer: HTMLDivElement | null = null;

    let isMiniMapExpanded = $state(false);
    let heading = $state(0);
    let position: google.maps.LatLng | google.maps.LatLngLiteral | null = null;

    let miniMap: google.maps.Map | null = null;
    let isMiniMapDragging = false;
    let shouldSyncPanoramaFromMiniMap = false;
    let isMovingPanorama = false;
    let syncDebounceTimer: ReturnType<typeof setTimeout> | null = null;

    let mapListeners: google.maps.MapsEventListener[] = [];
    let panoramaListeners: google.maps.MapsEventListener[] = [];

    $effect(() => {
        if (!visible) {
            isMiniMapExpanded = false;
            isMiniMapDragging = false;
            shouldSyncPanoramaFromMiniMap = false;
            isMovingPanorama = false;
        }
    });

    $effect(() => {
        if (visible && panorama) {
            syncFromPanorama();
        }
    });

    function syncFromPanorama() {
        if (!panorama) {
            return;
        }

        heading = panorama.getPov().heading;
        position = panorama.getPosition() ?? null;
        updateMiniMap();
    }

    async function ensureMiniMap() {
        if (!visible || !miniMapContainer || miniMap) {
            return;
        }

        const provider = mapState.provider;
        if (!(provider instanceof GoogleMapsProvider)) {
            return;
        }

        const {Map} = await provider.loader.importLibrary('maps');
        const center = position ?? provider.getCenter() ?? undefined;

        miniMap = new Map(miniMapContainer, {
            mapId: config.googleMapsId,
            disableDefaultUI: true,
            clickableIcons: false,
            disableDoubleClickZoom: true,
            gestureHandling: 'greedy',
            keyboardShortcuts: false,
            scrollwheel: false,
            zoom: 18,
            center,
        } as google.maps.MapOptions);

        mapListeners.push(
            miniMap.addListener('dragstart', () => {
                isMiniMapDragging = true;
                shouldSyncPanoramaFromMiniMap = false;
            }),
            miniMap.addListener('dragend', () => {
                isMiniMapDragging = false;
                shouldSyncPanoramaFromMiniMap = true;
            }),
            miniMap.addListener('idle', () => {
                if (!shouldSyncPanoramaFromMiniMap) {
                    return;
                }
                if (syncDebounceTimer) {
                    clearTimeout(syncDebounceTimer);
                }
                syncDebounceTimer = setTimeout(() => {
                    syncDebounceTimer = null;
                    void syncPanoramaToMiniMapCenter();
                }, 300);
            }),
        );

        updateMiniMap();
    }

    function updateMiniMap() {
        if (!miniMap || !visible) {
            return;
        }

        if (position && !isMiniMapDragging && !isMovingPanorama) {
            miniMap.setCenter(position);
        }
    }

    async function syncPanoramaToMiniMapCenter() {
        if (!miniMap || !panorama || isMovingPanorama || !shouldSyncPanoramaFromMiniMap) {
            return;
        }

        const center = miniMap.getCenter();
        if (!center) {
            shouldSyncPanoramaFromMiniMap = false;
            return;
        }

        shouldSyncPanoramaFromMiniMap = false;
        isMovingPanorama = true;

        try {
            const currentPov = panorama.getPov();
            const location = await resolveStreetViewLocation(center.lat(), center.lng());

            applyStreetViewLocation(panorama, location);
            panorama.setPov(currentPov);
        } catch (error) {
            console.error(error);
        } finally {
            isMovingPanorama = false;
            updateMiniMap();
        }
    }

    async function toggleMiniMapSize() {
        if (!miniMap) {
            return;
        }

        isMiniMapExpanded = !isMiniMapExpanded;
        await tick();

        google.maps.event.trigger(miniMap, 'resize');
        updateMiniMap();
    }

    function cleanupMapListeners() {
        for (const l of mapListeners) {
            l.remove();
        }
        mapListeners = [];
    }

    function cleanupPanoramaListeners() {
        for (const l of panoramaListeners) {
            l.remove();
        }
        panoramaListeners = [];
    }

    $effect(() => {
        if (!panorama) {
            cleanupPanoramaListeners();
            return;
        }

        syncFromPanorama();
        cleanupPanoramaListeners();

        panoramaListeners.push(
            panorama.addListener('position_changed', () => {
                position = panorama!.getPosition() ?? null;
                updateMiniMap();
            }),
            panorama.addListener('pov_changed', () => {
                heading = panorama!.getPov().heading ?? heading;
                updateMiniMap();
            }),
        );

        return () => cleanupPanoramaListeners();
    });

    $effect(() => {
        if (visible && panorama && miniMapContainer) {
            void ensureMiniMap();
        }
    });

    onDestroy(() => {
        if (syncDebounceTimer) {
            clearTimeout(syncDebounceTimer);
        }
        cleanupMapListeners();
        cleanupPanoramaListeners();
        miniMap = null;
    });
</script>

<div
    class={cn(
        'pointer-events-auto absolute top-4 left-4 overflow-hidden rounded-2xl shadow-lg ring-1 shadow-black/[0.08] ring-black/[0.06] transition-[width,height] duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] sm:top-auto sm:right-4 sm:bottom-4 sm:left-auto dark:shadow-black/40 dark:ring-white/[0.1]',
        isMiniMapExpanded
            ? 'h-[min(22rem,calc(100vh-7rem))] w-[min(22rem,calc(100vw-2rem))] sm:h-72 sm:w-[22rem]'
            : 'h-44 w-[min(16rem,calc(100vw-2rem))] sm:h-40 sm:w-55',
    )}
>
    <div bind:this={miniMapContainer} class="absolute inset-0"></div>

    <div class="pointer-events-none absolute inset-0 z-10">
        <div
            class="absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-black/[0.03] to-transparent dark:from-black/10"
        ></div>

        <div class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <svg
                width="40"
                height="40"
                viewBox="0 0 40 40"
                class="drop-shadow-[0_1px_3px_rgba(0,0,0,0.3)]"
                style={`transform: rotate(${heading}deg);`}
            >
                <defs>
                    <radialGradient id="sv-pulse-grad">
                        <stop offset="0%" stop-color="var(--primary)" stop-opacity="0.25" />
                        <stop offset="100%" stop-color="var(--primary)" stop-opacity="0" />
                    </radialGradient>
                </defs>

                <circle cx="20" cy="20" r="18" fill="url(#sv-pulse-grad)" />

                <path d="M20 2 L26 16 Q20 14 14 16 Z" fill="var(--primary)" opacity="0.55" />

                <circle cx="20" cy="20" r="5.5" fill="var(--primary)" />
                <circle cx="20" cy="20" r="3.5" fill="white" />
                <circle cx="20" cy="20" r="2" fill="var(--primary)" />
            </svg>
        </div>
    </div>

    <Button
        variant="ghost"
        size="icon"
        class="absolute top-1.5 left-1.5 z-20 size-7 rounded-lg bg-white/80 shadow-sm ring-1 ring-black/[0.06] backdrop-blur-sm hover:bg-white dark:bg-black/50 dark:ring-white/[0.08] dark:hover:bg-black/70"
        aria-label={isMiniMapExpanded ? 'Collapse minimap' : 'Expand minimap'}
        title={isMiniMapExpanded ? 'Collapse minimap' : 'Expand minimap'}
        onclick={toggleMiniMapSize}
    >
        {#if isMiniMapExpanded}
            <Minimize2Icon class="size-3.5 text-black/60 dark:text-white/60" />
        {:else}
            <Maximize2Icon class="size-3.5 text-black/60 dark:text-white/60" />
        {/if}
    </Button>
</div>
