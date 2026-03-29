<script lang="ts">
    import MarkerIcon from '$lib/components/map/markerIcon.svelte';
    import {onMount, onDestroy} from 'svelte';
    import {mapState} from '$lib/state/map.svelte';
    import type {IMarkerHandle} from '$lib/interfaces/map';
    import DotIcon from '@lucide/svelte/icons/dot';
    import {mount, unmount} from 'svelte';

    interface Props {
        orientationEnabled: boolean;
    }

    interface DeviceOrientationEventExtended extends DeviceOrientationEvent {
        webkitCompassHeading?: number;
    }

    let {orientationEnabled}: Props = $props();

    let handle: IMarkerHandle | undefined = $state();
    let markerIcon: ReturnType<typeof mount> | undefined;
    let updateLocationInterval: ReturnType<typeof setInterval> | undefined;

    onMount(async () => {
        const icon = document.createElement('div');
        icon.className = 'nav-marker';
        markerIcon = mount(MarkerIcon, {
            target: icon,
            props: {
                icon: DotIcon,
                className: 'stroke-3',
            },
        });

        await mapState.provider!.preloadMarkerLibrary();

        handle = mapState.provider!.createMarkerHandle({lat: 0, lng: 0}, icon, {
            zIndex: 10,
            clickable: false,
        });
        handle.show();

        updateCurrentPosition(true);
        updateLocationInterval = setInterval(updateCurrentPosition, 1000);
    });

    onDestroy(() => {
        if (updateLocationInterval) {
            clearInterval(updateLocationInterval);
        }
        if (markerIcon) {
            unmount(markerIcon);
        }
        handle?.remove();
    });

    function handleOrientation(event: DeviceOrientationEventExtended) {
        const element = handle?.getElement();
        if (!element) {
            return;
        }

        const degrees = event.webkitCompassHeading ? event.webkitCompassHeading : event.alpha;
        element.style.rotate = `${degrees}deg`;
    }

    function updateCurrentPosition(forceStale = false) {
        if (!handle) {
            return;
        }

        let position = {lat: 0, lng: 0, isCurrent: false};
        if (localStorage.getItem('lastPosition')) {
            position = JSON.parse(localStorage.getItem('lastPosition') as string);
        }

        handle.setPosition({lat: position.lat, lng: position.lng});
        const element = handle.getElement();
        if (!position.isCurrent || forceStale) {
            element?.classList.add('nav-marker-stale');
            element?.classList.add('nav-marker-oriented-stale');
        } else {
            element?.classList.remove('nav-marker-stale');
            element?.classList.remove('nav-marker-oriented-stale');
        }
    }

    $effect(() => {
        const element = handle?.getElement();
        if (orientationEnabled) {
            element?.classList.add('nav-marker-oriented');
            window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
            element?.classList.remove('nav-marker-oriented');
            window.removeEventListener('deviceorientation', handleOrientation, true);
        }
    });
</script>
