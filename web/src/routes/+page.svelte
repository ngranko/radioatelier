<script lang="ts">
    // import {onMount} from 'svelte';
    import {createMutation, createQuery} from '@tanstack/svelte-query';
    import {createObject, deleteObject, listObjects} from '$lib/api/object';
    import type {Object} from '$lib/interfaces/object';
    import {/*mapLoader, */ map, activeObjectInfo, activeMarker} from '$lib/stores/map';
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

    let permanentMarkers: {[key: string]: MarkerItem} = {};

    const createObjectMutation = createMutation({
        mutationFn: createObject,
    });

    const deleteObjectMutation = createMutation({
        mutationFn: deleteObject,
    });

    const objects = createQuery({queryKey: ['objects'], queryFn: listObjects});

    $: if ($objects.isSuccess) {
        for (const object of $objects.data.data.objects) {
            permanentMarkers[object.id] = object;
        }
    }

    // onMount(async () => {
    //     const {ControlPosition} = await $mapLoader.importLibrary('core');
    //
    //     // // Create the search box and link it to the UI element.
    //     const input = document.getElementById('pac-input') as HTMLInputElement;
    //     try {
    //         console.log('initializing search box');
    //         const placesLib = await $mapLoader.importLibrary('places');
    //         console.log(placesLib);
    //         const searchBox = new placesLib.SearchBox(input);
    //
    //         $map.controls[ControlPosition.TOP_RIGHT].push(input);
    //
    //         // Bias the SearchBox results towards current map's viewport.
    //         $map.addListener('bounds_changed', () => {
    //             searchBox.setBounds($map.getBounds() as google.maps.LatLngBounds);
    //         });
    //     } catch (e) {
    //         console.error(e);
    //     }
    // });

    function handleClose() {
        if (!$activeObjectInfo.object) {
            return;
        }

        activeMarker.deactivate();
        activeObjectInfo.reset();
    }

    async function handleSave(event: CustomEvent<Object>) {
        if (!$activeObjectInfo.object) {
            return;
        }

        if (!event.detail.id) {
            try {
                const result = await $createObjectMutation.mutateAsync(event.detail);
                permanentMarkers[result.data.id] = result.data;
                activeObjectInfo.reset();
            } catch (error) {
                console.error($createObjectMutation.error);
                return;
            }
        } else {
            console.log('updates are not working for now');
        }
    }

    async function handleDelete(event: CustomEvent<string>) {
        if (!$activeObjectInfo.object || !event.detail) {
            return;
        }

        try {
            const result = await $deleteObjectMutation.mutateAsync({id: event.detail});
            delete permanentMarkers[result.data.id];
            permanentMarkers = {...permanentMarkers};
            activeObjectInfo.reset();
            activeMarker.set(null);
        } catch (error) {
            console.error($createObjectMutation.error);
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
        on:delete={handleDelete}
    />
{/if}

<div>
    <!--    <input id="pac-input" class="search" type="text" placeholder="Search Box" />-->
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

<!--<style>-->
<!--    .search {-->
<!--        margin: 16px;-->
<!--        position: relative;-->
<!--        right: 0;-->
<!--    }-->
<!--</style>-->
