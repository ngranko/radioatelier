<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {mapLoader, map} from '$lib/stores/map';

    let marker: google.maps.marker.AdvancedMarkerElement;
    let updateLocationInterval: number | undefined;

    onMount(async () => {
        let position = {lat: 0, lng: 0};
        if (localStorage.getItem('lastCenter')) {
            position = JSON.parse(localStorage.getItem('lastCenter') as string);
        }

        if (position.lat === 0 && position.lng === 0) {
            return;
        }

        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa-solid fa-circle-dot"></i>';
        icon.className = 'current-location-marker';

        console.log(icon);

        const {AdvancedMarkerElement, CollisionBehavior} = await $mapLoader.importLibrary('marker');

        marker = new AdvancedMarkerElement({
            map: $map,
            position: {lat: position.lat, lng: position.lng},
            content: icon,
            collisionBehavior: CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL,
            gmpClickable: false,
        });

        updateLocationInterval = setInterval(updateCurrentPosition, 5000);
    });

    onDestroy(() => {
        if (updateLocationInterval) {
            clearInterval(updateLocationInterval);
        }
    });

    function updateCurrentPosition() {
        let position = {lat: 0, lng: 0};
        if (localStorage.getItem('lastCenter')) {
            position = JSON.parse(localStorage.getItem('lastCenter') as string);
        }

        marker.position = {lat: position.lat, lng: position.lng};
    }
</script>

<style lang="scss">
    @use '../../../styles/colors';
    @use '../../../styles/typography';

    :global(.current-location-marker) {
        @include typography.size-20;
        width: 20px;
        height: 20px;
        transform: translate(0, 50%);
        color: colors.$black;
    }
</style>
