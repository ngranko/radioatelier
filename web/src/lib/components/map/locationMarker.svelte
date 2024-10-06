<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {mapLoader, map} from '$lib/stores/map';

    export let orientationEnabled: boolean;

    let marker: google.maps.marker.AdvancedMarkerElement;
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

    $: if (orientationEnabled) {
        $marker.content.classList.add('current-location-marker-oriented');
        window.addEventListener('deviceorientation', handleOrientation, true);
    }

    function handleOrientation(event: DeviceOrientationEvent) {
        console.log(event.alpha);
        $marker.content.style.transform = `translate(0, 50%), rotate(${event.alpha}deg)`;
    }

    function updateCurrentPosition(forceStale = false) {
        let position = {lat: 0, lng: 0, isCurrent: false};
        if (localStorage.getItem('lastPosition')) {
            position = JSON.parse(localStorage.getItem('lastPosition') as string);
        }

        marker.position = {lat: position.lat, lng: position.lng};
        if (position.isCurrent || forceStale) {
            (marker.content as HTMLDivElement).classList.remove('current-location-marker-stale');
        } else {
            (marker.content as HTMLDivElement).classList.add('current-location-marker-stale');
        }
    }
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
            box-shadow 0.1s ease-in-out,
            color 0.1s ease-in-out;

        & :global(i) {
            display: block;
        }

        &::before {
            content: '';
            position: absolute;
            top: -50%;
            left: 0;
            width: 100%;
            height: 100%;
            border-radius: 50%;
            background-color: colors.$primary;
            opacity: 0.5;
            transition: opacity 0.1s ease-in-out;
        }
    }

    :global(.current-location-marker-oriented)::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        border-radius: 50%;
        background-color: colors.$primary;
        opacity: 0.5;
        transition: opacity 0.1s ease-in-out;
    }

    :global(.current-location-marker-stale) {
        color: colors.$darkgray;
        box-shadow: 0 0 10px colors.$darkgray;
    }
</style>
