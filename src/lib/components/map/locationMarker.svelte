<script lang="ts">
    import MarkerIcon from '$lib/components/map/markerIcon.svelte';
    import {onMount, onDestroy} from 'svelte';
    import {mapState} from '$lib/state/map.svelte';
    import DotIcon from '@lucide/svelte/icons/dot';
    import {mount, unmount} from 'svelte';

    interface Props {
        orientationEnabled: boolean;
    }

    interface DeviceOrientationEventExtended extends DeviceOrientationEvent {
        webkitCompassHeading?: number;
    }

    let {orientationEnabled}: Props = $props();

    let marker: google.maps.marker.AdvancedMarkerElement | undefined = $state();
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

        const {AdvancedMarkerElement, CollisionBehavior} =
            await mapState.loader.importLibrary('marker');

        marker = new AdvancedMarkerElement({
            map: mapState.map,
            content: icon,
            collisionBehavior: CollisionBehavior.REQUIRED,
            gmpClickable: false,
            zIndex: 10,
        });

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
    });

    function handleOrientation(event: DeviceOrientationEventExtended) {
        if (!marker) {
            return;
        }

        const degrees = event.webkitCompassHeading ? event.webkitCompassHeading : event.alpha;
        (marker.content as HTMLElement).style.rotate = `${degrees}deg`;
    }

    function updateCurrentPosition(forceStale = false) {
        if (!marker) {
            return;
        }

        let position = {lat: 0, lng: 0, isCurrent: false};
        if (localStorage.getItem('lastPosition')) {
            position = JSON.parse(localStorage.getItem('lastPosition') as string);
        }

        marker.position = {lat: position.lat, lng: position.lng};
        if (!position.isCurrent || forceStale) {
            (marker.content as HTMLDivElement).classList.add('nav-marker-stale');
            (marker.content as HTMLDivElement).classList.add('nav-marker-oriented-stale');
        } else {
            (marker.content as HTMLDivElement).classList.remove('nav-marker-stale');
            (marker.content as HTMLDivElement).classList.remove('nav-marker-oriented-stale');
        }
    }

    $effect(() => {
        if (orientationEnabled) {
            if (marker && marker.content) {
                (marker.content as HTMLDivElement).classList.add('nav-marker-oriented');
            }
            window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
            if (marker && marker.content) {
                (marker.content as HTMLDivElement).classList.remove('nav-marker-oriented');
            }
            window.removeEventListener('deviceorientation', handleOrientation, true);
        }
    });
</script>
