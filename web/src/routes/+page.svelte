<svelte:head>
    <script defer async src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDLWuVdej-R0l4O-aabmUVOyfcMA6gtWh4&loading=async&libraries=places,marker&callback=initMap"></script>
</svelte:head>

<script lang="ts">
    import {onMount} from 'svelte';
    import {base} from '$app/paths';

    let container: HTMLDivElement;
    let map: google.maps.Map;
    let zoom = 15;
    let center = {lat: 25.12524288324294, lng: 121.47016458217341};
    let tempMarker: google.maps.marker.AdvancedMarkerElement | null = null;
    let icon: HTMLImageElement;

    onMount(async () => {
        icon = document.createElement('img');
        icon.src = `${base}/pointDefault.svg`;
        icon.style.transform = 'translate(0, 50%)';

        const lastCenter = localStorage.getItem('lastCenter');
        if (lastCenter) {
            center = JSON.parse(lastCenter)
        }

        window.initMap = function () {
            console.log('initializing map');

            //init Map
            map = new google.maps.Map(container, {
                zoom,
                center,
                mapId: '5b6e83dfb8822236',
                // I can always enable it if I see that I need it< but for now let's leave as little controls as I can
                mapTypeControl: false,
                // mapTypeControlOptions: {
                //     style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
                //     mapTypeIds: ["roadmap", "satellite"],
                //     position: google.maps.ControlPosition.RIGHT_BOTTOM,
                // },
                fullscreenControl: false,
                controlSize: 40,
                zoomControl: false,
                streetViewControlOptions: {
                    position: google.maps.ControlPosition.RIGHT_BOTTOM,
                },
            });

            google.maps.event.addListener(map, 'click', function(event: google.maps.MapMouseEvent) {
                isInteracted = true;
                console.log(event.latLng);
                console.log({lat: event.latLng?.lat(), lng: event.latLng?.lng()});

                if (tempMarker) {
                    tempMarker.map = null;
                    tempMarker = null;
                }

                if (event.latLng) {
                    tempMarker = new google.maps.marker.AdvancedMarkerElement({
                        map,
                        position: {lat: event.latLng.lat(), lng: event.latLng.lng()},
                        content: icon,
                    });
                }
            });

            google.maps.event.addListener(map, 'bounds_changed', function() {
                isInteracted = true;
            });

            google.maps.event.addListener(map, 'maptypeid_changed', function() {
                isInteracted = true;
            });

            google.maps.event.addListener(map, 'resize', function() {
                isInteracted = true;
            });

            google.maps.event.addListener(map, 'rightclick', function() {
                isInteracted = true;
            });

            // Create the search box and link it to the UI element.
            const input = document.getElementById("pac-input") as HTMLInputElement;
            const searchBox = new google.maps.places.SearchBox(input);

            map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);

            // Bias the SearchBox results towards current map's viewport.
            map.addListener("bounds_changed", () => {
                searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
            });
        }

        // TODO: start loading a google maps script programmatically after this point

        let isInteracted = false;
        const loadedAt = Date.now();

        navigator.geolocation.getCurrentPosition(
            (position => {
                center = {lat: position.coords.latitude, lng: position.coords.longitude};
                localStorage.setItem('lastCenter', JSON.stringify(center));
                console.log(center);
                console.log('geolocation loaded in', Date.now() - loadedAt);

                if (!isInteracted && map) {
                    map.setCenter({lat: position.coords.latitude, lng: position.coords.longitude});
                }
            }),
            (position) => {console.log(position)},
            {
                enableHighAccuracy: false,
                maximumAge: Infinity,
            },
        );

        //init Map
        // map = new google.maps.Map(container, {
        //     zoom,
        //     center,
        //     mapId: '5b6e83dfb8822236',
        //     // I can always enable it if I see that I need it< but for now let's leave as little controls as I can
        //     mapTypeControl: false,
        //     // mapTypeControlOptions: {
        //     //     style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
        //     //     mapTypeIds: ["roadmap", "satellite"],
        //     //     position: google.maps.ControlPosition.RIGHT_BOTTOM,
        //     // },
        //     fullscreenControl: false,
        //     controlSize: 40,
        //     zoomControl: false,
        //     streetViewControlOptions: {
        //         position: google.maps.ControlPosition.RIGHT_BOTTOM,
        //     },
        // });
        //
        // google.maps.event.addListener(map, 'click', function(event: google.maps.MapMouseEvent) {
        //     isInteracted = true;
        //     console.log(event.latLng);
        //     console.log({lat: event.latLng?.lat(), lng: event.latLng?.lng()});
        //
        //     if (tempMarker) {
        //         tempMarker.map = null;
        //         tempMarker = null;
        //     }
        //
        //     if (event.latLng) {
        //         tempMarker = new google.maps.marker.AdvancedMarkerElement({
        //             map,
        //             position: {lat: event.latLng.lat(), lng: event.latLng.lng()},
        //         });
        //     }
        // });
        //
        // google.maps.event.addListener(map, 'bounds_changed', function() {
        //     isInteracted = true;
        // });
        //
        // google.maps.event.addListener(map, 'maptypeid_changed', function() {
        //     isInteracted = true;
        // });
        //
        // google.maps.event.addListener(map, 'resize', function() {
        //     isInteracted = true;
        // });
        //
        // google.maps.event.addListener(map, 'rightclick', function() {
        //     isInteracted = true;
        // });
        //
        // // Create the search box and link it to the UI element.
        // const input = document.getElementById("pac-input") as HTMLInputElement;
        // const searchBox = new google.maps.places.SearchBox(input);
        //
        // map.controls[google.maps.ControlPosition.TOP_RIGHT].push(input);
        //
        // // Bias the SearchBox results towards current map's viewport.
        // map.addListener("bounds_changed", () => {
        //     searchBox.setBounds(map.getBounds() as google.maps.LatLngBounds);
        // });
    });
</script>

<style>
    .full-screen {
        width: 100%;
        height: 100vh;
    }
</style>

<input
    id="pac-input"
    class="controls"
    type="text"
    placeholder="Search Box"
/>
<div class="full-screen" bind:this={container}></div>
