<script lang="ts">
    import StreetViewOverlay from '$lib/components/map/streetViewOverlay.svelte';
    import {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
    import {mapState} from '$lib/state/map.svelte';
    import {setOverlayPosition} from '$lib/state/objectDetailsOverlay.svelte';
    import {cn} from '$lib/utils';
    import {registerEscapeCloseHandler} from '$lib/utils/escapeClose';
    import {importLibrary} from '@googlemaps/js-api-loader';
    import {onDestroy, onMount} from 'svelte';

    let streetViewContainer: HTMLDivElement | undefined = $state();
    let panorama: google.maps.StreetViewPanorama | null = $state(null);
    let isStreetViewVisible = $state(false);

    let listeners: google.maps.MapsEventListener[] = [];

    let instantiated = false;
    $effect(() => {
        if (mapState.isReady && !instantiated) {
            createStreetView()
                .then(() => (instantiated = true))
                .catch(error => console.error(error));
        }
    });

    async function createStreetView() {
        if (!mapState.isReady || !streetViewContainer) {
            throw new Error('Prerequisites for Street View instantiation are not met');
        }

        const provider = mapState.provider;
        if (!(provider instanceof GoogleMapsProvider)) {
            return;
        }

        const {StreetViewPanorama} = await importLibrary('streetView');

        const googleMap = provider.getGoogleMap();
        if (!googleMap) {
            throw new Error('Google Maps instance not available for Street View');
        }

        panorama = new StreetViewPanorama(streetViewContainer, {
            visible: false,
            addressControl: false,
            fullscreenControl: false,
            motionTracking: false,
            panControl: false,
            linksControl: true,
            enableCloseButton: false,
            zoomControl: false,
        });

        googleMap.setStreetView(panorama);
        addListeners();
    }

    function cleanupListeners() {
        for (const l of listeners) {
            l.remove();
        }
        listeners = [];
    }

    function addListeners() {
        if (!panorama) {
            return;
        }

        cleanupListeners();

        listeners.push(
            panorama.addListener('visible_changed', () => {
                isStreetViewVisible = panorama!.getVisible();
                mapState.streetViewVisible = isStreetViewVisible;
                if (!isStreetViewVisible) {
                    panorama!.setZoom(1);
                    setOverlayPosition('full');
                }
            }),
        );
    }

    onDestroy(() => {
        cleanupListeners();
        mapState.streetViewVisible = false;
        panorama = null;
    });

    onMount(() =>
        registerEscapeCloseHandler({
            priority: 40,
            isActive: () => mapState.streetViewVisible,
            close: () => mapState.provider?.closeStreetView(),
        }),
    );
</script>

<div class="pointer-events-none fixed inset-0 z-2">
    <div
        class={cn({
            'absolute inset-0 transition-opacity duration-150': true,
            'pointer-events-auto opacity-100': isStreetViewVisible,
            'pointer-events-none opacity-0': !isStreetViewVisible,
        })}
        bind:this={streetViewContainer}
    ></div>
    <StreetViewOverlay {panorama} />
</div>
