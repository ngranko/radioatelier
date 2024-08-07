<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {createObject, deleteObject, listObjects} from '$lib/api/object';
    import type {Object} from '$lib/interfaces/object';
    import {/*mapLoader, */ map, activeObjectInfo, activeMarker} from '$lib/stores/map';
    import Map from '$lib/components/map/map.svelte';
    import Marker from '$lib/components/map/marker.svelte';
    import ObjectDetails from '$lib/components/objectDetails.svelte';
    import type {Location} from '$lib/interfaces/location';
    import {updateObject} from '$lib/api/object.js';
    import toast from 'svelte-french-toast';
    import RequestError from '$lib/errors/RequestError';
    import {goto} from '$app/navigation';
    import {page} from '$app/stores';

    interface MarkerItem {
        id: string;
        name?: string;
        lat: string;
        lng: string;
    }

    const client = useQueryClient();

    let permanentMarkers: {[key: string]: MarkerItem} = {};

    const createObjectMutation = createMutation({
        mutationFn: createObject,
    });

    const updateObjectMutation = createMutation({
        mutationFn: updateObject,
    });

    const deleteObjectMutation = createMutation({
        mutationFn: deleteObject,
    });

    const objects = createQuery({queryKey: ['objects'], queryFn: listObjects});
    $: if (
        $objects.isError &&
        $objects.error instanceof RequestError &&
        $objects.error.isAuthorizationError()
    ) {
        goto(`/login?ref=${encodeURIComponent($page.url.pathname)}`);
    }

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
            await toast.promise(createNewObject(event.detail), {
                loading: 'Создаю...',
                success: 'Объект создан!',
                error: 'Не удалось создать объект',
            });
        } else {
            await toast.promise(updateExistingObject(event.detail), {
                loading: 'Обновляю...',
                success: 'Объект обновлен!',
                error: 'Не удалось обновить объект',
            });
        }
    }

    async function createNewObject(object: Object) {
        const result = await $createObjectMutation.mutateAsync(object);
        client.setQueryData(['object', {id: result.data.id}], {
            message: '',
            data: {object: result.data},
        });
        permanentMarkers[result.data.id] = result.data;
        activeObjectInfo.reset();
    }

    async function updateExistingObject(object: Object) {
        const result = await $updateObjectMutation.mutateAsync({
            id: object.id,
            updatedFields: object,
        });
        client.setQueryData(['object', {id: result.data.id}], {
            message: '',
            data: {object: result.data},
        });
        activeObjectInfo.reset();
    }

    async function handleDelete(event: CustomEvent<string>) {
        if (!$activeObjectInfo.object || !event.detail) {
            return;
        }

        await toast.promise(deleteExistingObject(event.detail), {
            loading: 'Удаляю...',
            success: 'Объект удален!',
            error: 'Не удалось удалить объект',
        });
    }

    async function deleteExistingObject(id: string) {
        const result = await $deleteObjectMutation.mutateAsync({id});
        delete permanentMarkers[result.data.id];
        permanentMarkers = {...permanentMarkers};
        activeObjectInfo.reset();
        activeMarker.set(null);
    }

    function handleMapClick(event: CustomEvent<Location>) {
        activeObjectInfo.set({
            isLoading: false,
            detailsId: new Date().getTime().toString(),
            object: {id: null, lat: String(event.detail.lat), lng: String(event.detail.lng)},
        });
    }
</script>

{#if $activeObjectInfo.object}
    <ObjectDetails
        initialValues={$activeObjectInfo.object}
        key={$activeObjectInfo.detailsId}
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
