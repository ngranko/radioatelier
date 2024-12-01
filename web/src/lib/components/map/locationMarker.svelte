<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {mapLoader, map} from '$lib/stores/map';

    interface Props {
        orientationEnabled: boolean;
    }

    interface DeviceOrientationEventExtended extends DeviceOrientationEvent {
        webkitCompassHeading?: number;
    }

    let {orientationEnabled}: Props = $props();

    let marker: google.maps.marker.AdvancedMarkerElement | undefined = $state();
    let updateLocationInterval: number | undefined;

    onMount(async () => {
        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa-solid fa-circle-dot"></i>';
        icon.className = 'current-location-marker';

        const {AdvancedMarkerElement, CollisionBehavior} = await $mapLoader.importLibrary('marker');

        marker = new AdvancedMarkerElement({
            map: $map,
            content: icon,
            collisionBehavior: CollisionBehavior.REQUIRED,
            gmpClickable: false,
        });

        updateCurrentPosition(true);
        updateLocationInterval = setInterval(updateCurrentPosition, 1000);
    });

    onDestroy(() => {
        if (updateLocationInterval) {
            clearInterval(updateLocationInterval);
        }
    });

    function handleOrientation(event: DeviceOrientationEventExtended) {
        if (!marker) {
            return;
        }

        const degrees = event.webkitCompassHeading ? event.webkitCompassHeading - 180 : event.alpha;
        console.log(degrees);
        marker.style.transform = `translate(0, 50%) rotate(${degrees}deg)`;
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
            (marker.content as HTMLDivElement).classList.add('current-location-marker-stale');
        } else {
            (marker.content as HTMLDivElement).classList.remove('current-location-marker-stale');
        }
    }
    $effect(() => {
        if (orientationEnabled) {
            if (marker && marker.content) {
                (marker.content as HTMLDivElement).classList.add(
                    'current-location-marker-oriented',
                );
            }
            window.addEventListener('deviceorientation', handleOrientation, true);
        } else {
            if (marker && marker.content) {
                (marker.content as HTMLDivElement).classList.remove(
                    'current-location-marker-oriented',
                );
            }
            window.removeEventListener('deviceorientation', handleOrientation, true);
        }
    });
</script>

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    :global(.current-location-marker) {
        @include typography.size-20;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        transform: translate(0, 50%);
        color: colors.$primary;
        box-shadow: 0 0 10px colors.$primary;
        transition:
            box-shadow 0.2s ease-in-out,
            color 0.2s ease-in-out;

        & :global(i) {
            display: block;
        }

        &::before {
            content: '';
            box-sizing: border-box;
            position: absolute;
            top: -1.5px;
            left: 4px;
            width: 12px;
            height: 12px;
            border-radius: 2px;
            transform: scaleY(1.5) rotate(45deg);
            border-left: 5px solid colors.$primary;
            border-top: 5px solid colors.$primary;
            transform-origin: center;
            box-shadow: 0 0 10px colors.$primary;
            transition: opacity 0.1s ease-in-out;
            opacity: 0;
        }
    }

    :global(.current-location-marker-oriented) {
        &::before {
            opacity: 1;
        }
    }

    :global(.current-location-marker-stale) {
        color: colors.$darkgray;
        box-shadow: 0 0 10px colors.$darkgray;

        &::before {
            border-left-color: colors.$darkgray;
            border-top-color: colors.$darkgray;
            box-shadow: 0 0 10px colors.$darkgray;
        }
    }
</style>
