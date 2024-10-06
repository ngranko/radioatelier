<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {mapLoader, map} from '$lib/stores/map';

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

        updateCurrentPosition();
        updateLocationInterval = setInterval(updateCurrentPosition, 5000);

        if (
            window.DeviceOrientationEvent &&
            typeof DeviceOrientationEvent.requestPermission === 'function'
        ) {
            console.log('DeviceOrientationEvent supported');
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    console.log(permissionState);
                    window.addEventListener('deviceorientation', handleOrientation, true);
                })
                .catch(console.error);
        } else {
            console.warn('DeviceOrientationEvent not supported');
        }
    });

    onDestroy(() => {
        if (updateLocationInterval) {
            clearInterval(updateLocationInterval);
        }
    });

    function handleOrientation(event: DeviceOrientationEvent) {
        console.log(event.alpha);
        icon.style.transform = `translate(0, 50%), rotate(${event.alpha}deg)`;
    }

    function updateCurrentPosition() {
        let position = {lat: 0, lng: 0, isCurrent: false};
        if (localStorage.getItem('lastPosition')) {
            position = JSON.parse(localStorage.getItem('lastPosition') as string);
        }

        marker.position = {lat: position.lat, lng: position.lng};
        if (position.isCurrent) {
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
    }

    :global(.current-location-marker-stale) {
        color: colors.$darkgray;
        box-shadow: 0 0 10px colors.$darkgray;
    }
</style>
