<script lang="ts">
    import {onDestroy} from 'svelte';
    import config from '$lib/config';
    import {cn} from '$lib/utils';
    import Button from '$lib/components/ui/button/button.svelte';
    import {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
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
    let miniMapMarker: google.maps.marker.AdvancedMarkerElement | null = null;
    let miniMapMarkerContent: HTMLDivElement | null = null;

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

        const provider = mapState.provider;
        if (!(provider instanceof GoogleMapsProvider)) {
            return;
        }

        const [{Map}, {AdvancedMarkerElement}] = await Promise.all([
            provider.loader.importLibrary('maps'),
            provider.loader.importLibrary('marker'),
        ]);
        const center = position ?? provider.getCenter() ?? undefined;

        miniMap = new Map(miniMapContainer, {
            mapId: config.googleMapsId,
            disableDefaultUI: true,
            clickableIcons: false,
            gestureHandling: 'none',
            zoom: 18,
            center,
        } as google.maps.MapOptions);

        miniMapMarkerContent = createMiniMapMarkerContent();
        miniMapMarker = new AdvancedMarkerElement({
            map: miniMap,
            position: center,
            content: miniMapMarkerContent,
            gmpClickable: false,
            zIndex: 100,
        });

        updateMiniMap();
    }

    function updateMiniMap() {
        if (!miniMap || !miniMapMarker || !isVisible) {
            return;
        }

        if (position) {
            miniMap.setCenter(position);
            miniMapMarker.position = position;
        }

        if (miniMapMarkerContent) {
            miniMapMarkerContent.style.transform = `translateY(50%) rotate(${heading}deg)`;
        }
    }

    function createMiniMapMarkerContent() {
        const markerContent = document.createElement('div');
        markerContent.style.position = 'relative';
        markerContent.style.width = '28px';
        markerContent.style.height = '28px';
        markerContent.style.transform = 'translateY(50%)';
        markerContent.style.transformOrigin = '50% 65%';
        markerContent.style.filter = 'drop-shadow(0 2px 6px rgba(0, 0, 0, 0.28))';

        const arrow = document.createElement('div');
        arrow.style.position = 'absolute';
        arrow.style.top = '0';
        arrow.style.left = '50%';
        arrow.style.width = '0';
        arrow.style.height = '0';
        arrow.style.transform = 'translateX(-50%)';
        arrow.style.borderLeft = '7px solid transparent';
        arrow.style.borderRight = '7px solid transparent';
        arrow.style.borderBottom = '12px solid #1a73e8';

        const pin = document.createElement('div');
        pin.style.position = 'absolute';
        pin.style.left = '50%';
        pin.style.bottom = '1px';
        pin.style.width = '16px';
        pin.style.height = '16px';
        pin.style.transform = 'translateX(-50%)';
        pin.style.border = '2px solid white';
        pin.style.borderRadius = '9999px';
        pin.style.background = '#fbbc04';
        pin.style.boxSizing = 'border-box';

        markerContent.append(arrow, pin);

        return markerContent;
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
        if (miniMapMarker) {
            miniMapMarker.map = null;
        }
        miniMapMarker = null;
        miniMapMarkerContent = null;
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
    </div>
</div>
