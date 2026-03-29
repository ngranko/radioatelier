<script lang="ts">
    import StreetViewOverlay from './streetViewOverlay.svelte';
    import {cn} from '$lib/utils';
    import {onDestroy} from 'svelte';
    import {mapState} from '$lib/state/map.svelte';
    import {getGoogleProvider} from '$lib/services/map/providers/google/provider';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';

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

        const provider = getGoogleProvider();
        const {StreetViewPanorama} = await provider.loader.importLibrary('streetView');

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
                    objectDetailsOverlay.isMinimized = false;
                }
            }),
        );
    }

    onDestroy(() => {
        cleanupListeners();
        mapState.streetViewVisible = false;
        panorama = null;
    });
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
