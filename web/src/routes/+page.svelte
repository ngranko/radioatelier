<script lang="ts">
    import {onMount} from 'svelte';
    import {createMutation, createQuery} from '@tanstack/svelte-query';
    import {createObject, listObjects} from '$lib/api/object';
    import type {CreateObjectInputs} from '$lib/interfaces/object';
    import {mapLoader, map, activeObjectInfo} from '$lib/stores/map';
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

    const permanentMarkers: {[key: string]: MarkerItem} = {};

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

            $map.controls[ControlPosition.TOP_RIGHT].push(input);

            // Bias the SearchBox results towards current map's viewport.
            $map.addListener('bounds_changed', () => {
                searchBox.setBounds($map.getBounds() as google.maps.LatLngBounds);
            });
        } catch (e) {
            console.error(e);
        }
    });

    function handleClose() {
        if (!$activeObjectInfo.object) {
            return;
        }

        activeObjectInfo.reset();
    }

    async function handleSave(event: CustomEvent<CreateObjectInputs>) {
        if (!$activeObjectInfo.object) {
            return;
        }

        try {
            const result = await $mutation.mutateAsync(event.detail);
            permanentMarkers[`${result.data.lat}${result.data.lng}`] = result.data;
            activeObjectInfo.reset();
        } catch (error) {
            console.error($mutation.error);
            return;
        }
    }

    function handleMapClick(event: CustomEvent<Location>) {
        console.log(event.detail);
        activeObjectInfo.set({isLoading: false, object: {id: null, ...event.detail}});
    }
</script>

{#if $activeObjectInfo.object}
    <ObjectDetails
        initialValues={$activeObjectInfo.object}
        on:save={handleSave}
        on:close={handleClose}
    />
{/if}

<div>
    <input id="pac-input" class="search" type="text" placeholder="Search Box" />
    <Map on:click={handleMapClick} />
    {#if $map}
        {#each Object.values(permanentMarkers) as marker (marker.id)}
            <Marker id={marker.id} lat={marker.lat} lng={marker.lng} />
        {/each}

        {#if $activeObjectInfo.object && !$activeObjectInfo.object.id}
            {#key `${$activeObjectInfo.object.lat},${$activeObjectInfo.object.lng}`}
                <Marker
                    lat={$activeObjectInfo.object.lat}
                    lng={$activeObjectInfo.object.lng}
                    initialActive={true}
                />
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
