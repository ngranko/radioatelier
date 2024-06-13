<script lang="ts">
    import {onMount, createEventDispatcher} from 'svelte';
    import {mapLoader, map} from '$lib/stores/map';

    let container: HTMLDivElement;
    let isInteracted = false;
    const loadedAt = Date.now();

    const dispatch = createEventDispatcher();

    onMount(async () => {
        const {ControlPosition, event} = await $mapLoader.importLibrary('core');

        const mapOptions = {
            zoom: 15,
            // TODO: use geolocation API if everything else failed?
            center: JSON.parse(localStorage.getItem('lastCenter') ?? ''),
            mapId: '5b6e83dfb8822236',
            controlSize: 40,
            // I can always enable it if I see that I need it< but for now let's leave as little controls as I can
            mapTypeControl: false,
            // mapTypeControlOptions: {
            //     style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
            //     mapTypeIds: ["roadmap", "satellite"],
            //     position: google.maps.ControlPosition.RIGHT_BOTTOM,
            // },
            fullscreenControl: false,
            zoomControl: false,
            streetViewControlOptions: {
                position: ControlPosition.RIGHT_BOTTOM,
            },
        };

        try {
            const {Map} = await $mapLoader.importLibrary('maps');
            map.update(() => new Map(container, mapOptions));
        } catch (e) {
            console.error('error instantiating map');
            console.error(e);
        }

        try {
            event.addListener($map, 'click', function (event: google.maps.MapMouseEvent) {
                isInteracted = true;
                dispatch('click', {lat: event.latLng?.lat(), lng: event.latLng?.lng()});
            });

            event.addListener($map, 'bounds_changed', function () {
                isInteracted = true;
            });

            event.addListener($map, 'maptypeid_changed', function () {
                isInteracted = true;
            });

            event.addListener($map, 'resize', function () {
                isInteracted = true;
            });

            event.addListener($map, 'rightclick', function () {
                isInteracted = true;
            });
        } catch (e) {
            console.error('error initialising map event listeners');
            console.error(e);
        }

        updateCurrentPosition();
    });

    function updateCurrentPosition() {
        navigator.geolocation.getCurrentPosition(
            position => {
                const center = {lat: position.coords.latitude, lng: position.coords.longitude};
                localStorage.setItem('lastCenter', JSON.stringify(center));
                console.log(center);
                console.log('geolocation loaded in', Date.now() - loadedAt);

                if (!isInteracted && $map) {
                    $map.setCenter({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    });
                }
            },
            position => {
                console.log(position);
            },
            {
                enableHighAccuracy: false,
                maximumAge: Infinity,
            },
        );
    }
</script>

<div class="map" bind:this={container}></div>

<style>
    .map {
        width: 100%;
        height: 100vh;
    }
</style>
