<script lang="ts">
    import {mapState} from '$lib/state/map.svelte';

    function goToLastPosition() {
        let position = {lat: 0, lng: 0};
        if (localStorage.getItem('lastPosition')) {
            position = JSON.parse(localStorage.getItem('lastPosition') as string);
        }

        if (position.lat === 0 && position.lng === 0) {
            return;
        }

        if (mapState.map) {
            mapState.map.setCenter(position);
        }
    }
</script>

<button
    class="text-primary absolute right-2.5 bottom-18 z-1 flex w-10 items-center justify-center rounded-xs border-0 bg-white p-2.5 text-xl shadow-xs"
    onclick={goToLastPosition}
    aria-label="Go to last position"
>
    <i class="fa-solid fa-location-arrow -mb-0.5 block"></i>
</button>
