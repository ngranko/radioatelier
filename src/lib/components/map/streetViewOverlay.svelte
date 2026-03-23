<script lang="ts">
    import {onDestroy} from 'svelte';
    import config from '$lib/config';
    import {cn} from '$lib/utils';
    import Button from '../ui/button/button.svelte';
    import {mapState} from '$lib/state/map.svelte';
    import XMarkIcon from '@lucide/svelte/icons/x';

    interface Props {
        panorama: google.maps.StreetViewPanorama | null;
    }

    let {panorama}: Props = $props();

    let miniMapContainer: HTMLDivElement | null = null;

    let isVisible = $state(false);
    let heading = 0;
    let position: google.maps.LatLng | google.maps.LatLngLiteral | null = null;

    let miniMap: google.maps.Map | null = null;
    let pegmanOverlay: HTMLDivElement | null = null;

    let listeners: google.maps.MapsEventListener[] = [];

    let initialized = false;
    $effect(() => {
        if (panorama && !initialized) {
            attachPanorama();
            initialized = true;
        }
    });

    function syncFromPanorama() {
        if (!panorama) {
            return;
        }

        isVisible = panorama.getVisible();
        heading = panorama.getPov().heading;
        position = panorama.getPosition() ?? null;
        updateMiniMap();
    }

    async function ensureMiniMap() {
        if (!isVisible || !miniMapContainer || miniMap) {
            return;
        }

        const {Map} = await mapState.loader.importLibrary('maps');
        const center = position ?? mapState.map?.getCenter() ?? undefined;

        miniMap = new Map(miniMapContainer, {
            mapId: config.googleMapsId,
            disableDefaultUI: true,
            clickableIcons: false,
            gestureHandling: 'none',
            zoom: 18,
            center,
        } as google.maps.MapOptions);

        updateMiniMap();
    }

    function updateMiniMap() {
        if (!miniMap || !isVisible) {
            return;
        }

        if (position) {
            miniMap.setCenter(position);
        }

        if (pegmanOverlay) {
            pegmanOverlay.style.rotate = `${heading}deg`;
        }
    }

    function cleanupListeners() {
        for (const l of listeners) {
            l.remove();
        }
        listeners = [];
    }

    function attachPanorama() {
        if (!panorama) {
            return;
        }

        syncFromPanorama();
        cleanupListeners();

        listeners.push(
            panorama.addListener('visible_changed', () => {
                isVisible = panorama!.getVisible();
                if (isVisible) {
                    syncFromPanorama();
                    ensureMiniMap();
                }
            }),
            panorama.addListener('position_changed', () => {
                position = panorama!.getPosition() ?? null;
                updateMiniMap();
            }),
            panorama.addListener('pov_changed', () => {
                heading = panorama!.getPov().heading ?? heading;
                updateMiniMap();
            }),
        );

        if (isVisible) {
            ensureMiniMap();
        }
    }

    function exitStreetView() {
        if (panorama) {
            panorama.setVisible(false);
        }
    }

    onDestroy(() => {
        cleanupListeners();
        pegmanOverlay = null;
        miniMap = null;
    });
</script>

<div class={cn(['pointer-events-none absolute inset-0 z-1', {hidden: !isVisible}])}>
    <Button
        variant="secondary"
        size="icon"
        class="pointer-events-auto absolute top-3 right-3"
        onclick={exitStreetView}
    >
        <XMarkIcon class="stroke-3" />
    </Button>

    <div
        class="pointer-events-auto absolute relative top-3 left-3 h-40 w-55 overflow-hidden rounded-xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.25)] sm:top-auto sm:right-3 sm:bottom-3 sm:left-auto"
    >
        <div bind:this={miniMapContainer} class="absolute inset-0"></div>
        <div
            bind:this={pegmanOverlay}
            class="pointer-events-none absolute top-1/2 left-1/2 z-10 h-8 w-8 origin-[50%_60%] -translate-x-1/2 -translate-y-1/2"
        >
            <img
                class="h-8 w-8 object-contain drop-shadow-sm"
                alt="Street View heading"
                src="data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20width%3D%2224%22%20height%3D%2224%22%20viewBox%3D%220%200%2024%2024%22%3E%3Ccircle%20cx%3D%2212%22%20cy%3D%227%22%20r%3D%224%22%20fill%3D%22%23fbbc04%22/%3E%3Crect%20x%3D%227%22%20y%3D%2212%22%20width%3D%2210%22%20height%3D%226%22%20rx%3D%223%22%20fill%3D%22%231a73e8%22/%3E%3C/svg%3E"
            />
        </div>
    </div>
</div>
