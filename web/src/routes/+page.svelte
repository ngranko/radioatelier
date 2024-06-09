<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {createMutation, createQuery} from '@tanstack/svelte-query';
    import {createObject, listObjects} from '$lib/api/object';
    import type {CreateObjectInputs} from '$lib/interfaces/object';
    import {mapLoader, map} from '$lib/stores/map';
    import Map from '$lib/components/map/map.svelte';
    import Marker from '$lib/components/map/marker.svelte';
    import ObjectDetails from '$lib/components/objectDetails.svelte';
    import type {Location} from '$lib/interfaces/map';

    interface MarkerItem {
        id: string;
        name?: string;
        lat: string;
        lng: string;
    }

    let mapRef: google.maps.Map;
    const permanentMarkers: {[key: string]: MarkerItem} = {};
    let clickedLocation: Location | null = null;

    const unsubscribe = map.subscribe(value => {
        mapRef = value;
    });

    const mutation = createMutation({
        mutationFn: createObject,
    });

    const objects = createQuery({queryKey: ['objects'], queryFn: listObjects});

    $: if ($objects.isSuccess) {
        for (const object of $objects.data.data.objects) {
            permanentMarkers[`${object.lat}${object.lng}`] = object;
        }
    }

    onMount(async () => {
        const {ControlPosition} = await $mapLoader.importLibrary('core');

        // // Create the search box and link it to the UI element.
        const input = document.getElementById('pac-input') as HTMLInputElement;
        try {
            console.log('initializing search box');
            const placesLib = await $mapLoader.importLibrary('places');
            console.log(placesLib);
            const searchBox = new placesLib.SearchBox(input);

            mapRef.controls[ControlPosition.TOP_RIGHT].push(input);

            // Bias the SearchBox results towards current map's viewport.
            mapRef.addListener('bounds_changed', () => {
                searchBox.setBounds(mapRef.getBounds() as google.maps.LatLngBounds);
            });
        } catch (e) {
            console.error(e);
        }
    });

    onDestroy(unsubscribe);

    function handleClose() {
        if (clickedLocation === null) {
            return;
        }

        clickedLocation = null;
    }

    async function handleSave(event: CustomEvent<CreateObjectInputs>) {
        if (!clickedLocation) {
            return;
        }

        try {
            const result = await $mutation.mutateAsync(event.detail);
            permanentMarkers[`${result.data.lat}${result.data.lng}`] = result.data;
            clickedLocation = null;
        } catch (error) {
            console.error($mutation.error);
            return;
        }
    }

    function handleMapClick(event: CustomEvent<Location>) {
        console.log(event.detail);
        clickedLocation = event.detail;
    }
</script>

{#if clickedLocation !== null}
    <ObjectDetails
        initialValues={{
            lat: String(clickedLocation.lat),
            lng: String(clickedLocation.lng),
        }}
        on:save={handleSave}
        on:close={handleClose}
    />
{/if}

<div>
    <input id="pac-input" class="search" type="text" placeholder="Search Box" />
    <Map on:click={handleMapClick} />
    {#if mapRef}
        {#each Object.values(permanentMarkers) as marker (marker.id)}
            <Marker id={marker.id} lat={marker.lat} lng={marker.lng} />
        {/each}

        {#if clickedLocation}
            {#key `${clickedLocation.lat},${clickedLocation.lng}`}
                <Marker {...clickedLocation} />
            {/key}
        {/if}
    {/if}
</div>

<style>
    .search {
        margin: 16px;
        position: relative;
        right: 0;
    }
</style>
