<script lang="ts">
    import {mapLoader, map, activeObjectInfo} from '$lib/stores/map';
    import StreetViewOverlay from './streetViewOverlay.svelte';
    import {cn} from '$lib/utils';
    import {onDestroy} from 'svelte';

    let streetViewContainer: HTMLDivElement | undefined = $state();
    let panorama: google.maps.StreetViewPanorama | null = $state(null);
    let isStreetViewVisible = $state(false);

    let listeners: google.maps.MapsEventListener[] = [];

    let instantiated = false;
    $effect(() => {
        if ($map && !instantiated) {
            createStreetView()
                .then(() => (instantiated = true))
                .catch(error => console.error(error));
        }
    });

    async function createStreetView() {
        if (!$map || !streetViewContainer) {
            throw new Error('Prerequisites for Street View instantiation are not met');
        }

        const {StreetViewPanorama} = await $mapLoader.importLibrary('streetView');

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

        $map.setStreetView(panorama);

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
                if (!isStreetViewVisible) {
                    panorama!.setZoom(1);
                    activeObjectInfo.update(value => ({...value, isMinimized: false}));
                }
            }),
        );
    }

    onDestroy(() => {
        cleanupListeners();
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
