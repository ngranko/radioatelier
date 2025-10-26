<script lang="ts">
    import {onDestroy} from 'svelte';
    import config from '$lib/config';
    import {cn} from '$lib/utils';
    import Button from '../ui/button/button.svelte';
    import { mapState } from '$lib/state/map.svelte';

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

        miniMapContainer.append(makePegman());
        updateMiniMap();
    }

    function makePegman(): HTMLDivElement {
        if (!pegmanOverlay) {
            pegmanOverlay = document.createElement('div');
            pegmanOverlay.className =
                'absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 pointer-events-none z-10 origin-[50%_60%]';

            const img = document.createElement('img');
            img.className = 'w-8 h-8 object-contain drop-shadow-sm';
            img.src =
                'data:image/svg+xml;charset=UTF-8,' +
                encodeURIComponent(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><circle cx="12" cy="7" r="4" fill="#fbbc04"/><rect x="7" y="12" width="10" height="6" rx="3" fill="#1a73e8"/></svg>',
                );

            pegmanOverlay.append(img);
        }
        return pegmanOverlay;
    }

    function updateMiniMap() {
        if (!miniMap || !isVisible) {
            return;
        }

        if (position) {
            miniMap.setCenter(position);
        }

        if (pegmanOverlay) {
            pegmanOverlay.style.transform = `rotate(${heading}deg)`;
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
        <i class="fa-solid fa-xmark"></i>
    </Button>

    <div
        class="pointer-events-auto absolute top-3 right-3 h-40 w-55 overflow-hidden rounded-xl bg-white shadow-[0_2px_10px_rgba(0,0,0,0.25)] sm:top-auto sm:bottom-3"
        bind:this={miniMapContainer}
    ></div>
</div>
