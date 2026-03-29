<script lang="ts">
    import {mapState} from '$lib/state/map.svelte';
    import NavigationIcon from '@lucide/svelte/icons/navigation';

    function goToLastPosition() {
        let position = {lat: 0, lng: 0};
        if (localStorage.getItem('lastPosition')) {
            position = JSON.parse(localStorage.getItem('lastPosition') as string);
        }

        if (position.lat === 0 && position.lng === 0) {
            return;
        }

        if (mapState.isReady) {
            mapState.provider.setCenter(position.lat, position.lng);
        }
    }
</script>

<button
    class="bg-map-control text-primary absolute right-2.5 bottom-18 z-1 flex w-10 items-center justify-center rounded-xs border-0 p-2.5 shadow-md"
    onclick={goToLastPosition}
    aria-label="Go to last position"
>
    <NavigationIcon class="text-primary size-5 fill-current" />
</button>
