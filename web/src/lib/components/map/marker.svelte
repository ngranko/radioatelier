<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {base} from '$app/paths';
    import {mapLoader, map} from '$lib/stores/map';

    export let id: string;
    export let lat: string;
    export let lng: string;
    let mapRef: google.maps.Map;
    let marker: google.maps.marker.AdvancedMarkerElement;

    const unsubscribe = map.subscribe(value => {
        mapRef = value;
    });

    onMount(async () => {
        const icon = document.createElement('img');
        icon.src = `${base}/pointDefault.svg`;
        icon.style.transform = 'translate(0, 50%)';

        const {AdvancedMarkerElement, CollisionBehavior} = await $mapLoader.importLibrary('marker');

        marker = new AdvancedMarkerElement({
            map: mapRef,
            position: {lat: Number(lat), lng: Number(lng)},
            content: icon,
            collisionBehavior: CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL,
            gmpClickable: true,
        });
        marker.addListener('click', handleMarkerClick);
    });

    onDestroy(() => {
        unsubscribe();
        marker.map = null;
    });

    function handleMarkerClick() {
        console.log(id, lat, lng);
    }
</script>
