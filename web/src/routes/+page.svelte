<script lang="ts">
    import {createMutation, createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {createObject, deleteObject, listObjects} from '$lib/api/object';
    import type {ListObjectsResponsePayload, Object} from '$lib/interfaces/object';
    import {/*mapLoader, */ map, activeObjectInfo, activeMarker, markerList} from '$lib/stores/map';
    import Map from '$lib/components/map/map.svelte';
    import Marker from '$lib/components/map/marker.svelte';
    import UserMenu from '$lib/components/userMenu/userMenu.svelte';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';
    import type {Location} from '$lib/interfaces/location';
    import {updateObject} from '$lib/api/object.js';
    import toast from 'svelte-french-toast';
    import RequestError from '$lib/errors/RequestError';
    import {goto} from '$app/navigation';
    import {page} from '$app/stores';
    import type {Payload} from '$lib/interfaces/api';
    import type {UpdateObjectResponsePayload} from '$lib/interfaces/object.js';
    import CloseConfirmation from '$lib/components/objectDetails/closeConfirmation.svelte';
    import LocationMarker from '$lib/components/map/locationMarker.svelte';
    import {me} from '$lib/api/user';

    const client = useQueryClient();

    let orientationEnabled = false;
    let isConfirmationOpen = false;
    let savedLocation: Location | null = null;
    let consoleElement: HTMLElement;

    const createObjectMutation = createMutation({
        mutationFn: createObject,
        onSuccess: ({data}) => {
            const cachedListValue: Payload<ListObjectsResponsePayload> | undefined =
                client.getQueryData(['objects']);
            if (cachedListValue) {
                client.setQueryData(['objects'], {
                    data: {objects: [...cachedListValue.data.objects, data]},
                });
            }
        },
    });

    const updateObjectMutation = createMutation({
        mutationFn: updateObject,
        onSuccess: ({data}) => {
            const cachedValue: Payload<UpdateObjectResponsePayload> | undefined =
                client.getQueryData(['object', {id: data.id}]);
            if (cachedValue) {
                client.setQueryData(['object', {id: data.id}], {
                    data: {...cachedValue.data, ...data},
                });
            }
        },
    });

    const deleteObjectMutation = createMutation({
        mutationFn: deleteObject,
        onSuccess: ({data}) => {
            const cachedValue: Payload<ListObjectsResponsePayload> | undefined =
                client.getQueryData(['objects']);
            if (cachedValue) {
                client.setQueryData(['objects'], {
                    data: {objects: cachedValue.data.objects.filter(item => item.id != data.id)},
                });
            }
        },
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
        markerList.set($objects.data.data.objects);
    }

    const meQuery = createQuery({queryKey: ['me'], queryFn: me});
    $: if ($meQuery.isSuccess && $meQuery.data.data.role === 'admin') {
        import('eruda').then(eruda =>
            eruda.default.init({container: consoleElement, tool: ['console', 'elements']}),
        );
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
                success: 'Точка создана!',
                error: 'Не удалось создать точку',
            });
        } else {
            await toast.promise(updateExistingObject(event.detail), {
                loading: 'Обновляю...',
                success: 'Точка обновлена!',
                error: 'Не удалось обновить точку',
            });
        }
    }

    async function createNewObject(object: Object) {
        const result = await $createObjectMutation.mutateAsync(object);
        client.setQueryData(['object', {id: result.data.id}], {
            message: '',
            data: {object: result.data},
        });
        markerList.addMarker(result.data);
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
            success: 'Точка удалена!',
            error: 'Не удалось удалить точку',
        });
    }

    async function deleteExistingObject(id: string) {
        const result = await $deleteObjectMutation.mutateAsync({id});
        markerList.removeMarker(result.data.id);
        activeObjectInfo.reset();
        activeMarker.set(null);
    }

    function handleMapClick(event: CustomEvent<Location>) {
        savedLocation = {lat: event.detail.lat, lng: event.detail.lng};
        if ($activeObjectInfo.isEditing) {
            isConfirmationOpen = true;
        } else {
            setActiveObject();
        }
    }

    function setActiveObject() {
        activeObjectInfo.set({
            isLoading: false,
            isEditing: true,
            detailsId: new Date().getTime().toString(),
            object: {
                id: null,
                lat: String(savedLocation!.lat),
                lng: String(savedLocation!.lng),
                isVisited: false,
                isRemoved: false,
            },
        });
    }

    function goToLastPosition() {
        let position = {lat: 0, lng: 0};
        if (localStorage.getItem('lastPosition')) {
            position = JSON.parse(localStorage.getItem('lastPosition') as string);
        }

        if (position.lat === 0 && position.lng === 0) {
            return;
        }

        $map.setCenter(position);
    }

    function enableOrientation() {
        if (
            window.DeviceOrientationEvent &&
            typeof DeviceOrientationEvent.requestPermission === 'function'
        ) {
            console.log('DeviceOrientationEvent supported');
            DeviceOrientationEvent.requestPermission()
                .then(permissionState => {
                    console.log(permissionState);
                    orientationEnabled = true;
                })
                .catch(error => {
                    console.error('error while requesting DeviceOrientationEvent permission');
                    console.error(error);
                });
        } else {
            console.warn('DeviceOrientationEvent not supported');
        }
    }
</script>

<div bind:this={consoleElement} />

<button
    class={orientationEnabled ? 'orientationButtonActive' : 'orientationButton'}
    on:click={enableOrientation}
>
    <i class="fa-solid fa-compass"></i>
</button>

<button class="positionButton" on:click={goToLastPosition}>
    <i class="fa-solid fa-location-arrow"></i>
</button>

<UserMenu />

{#if $activeObjectInfo.object}
    <ObjectDetails
        initialValues={$activeObjectInfo.object}
        key={$activeObjectInfo.detailsId}
        isLoading={$activeObjectInfo.isLoading}
        isEditing={$activeObjectInfo.isEditing}
        on:save={handleSave}
        on:close={handleClose}
        on:delete={handleDelete}
    />
    <CloseConfirmation bind:isOpen={isConfirmationOpen} on:click={setActiveObject} />
{/if}

<div>
    <!--    <input id="pac-input" class="search" type="text" placeholder="Search Box" />-->
    <Map on:click={handleMapClick} />
    {#if $map}
        <LocationMarker {orientationEnabled} />
        {#each Object.values($markerList) as marker (marker.id)}
            <Marker
                id={marker.id}
                lat={marker.lat}
                lng={marker.lng}
                isVisited={marker.isVisited}
                isRemoved={marker.isRemoved}
            />
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

<style lang="scss">
    @use '../styles/colors';
    @use '../styles/typography';

    .orientationButton {
        @include typography.size-20;
        position: absolute;
        width: 40px;
        padding: 10px;
        border: none;
        border-radius: 2px;
        background-color: white;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
        bottom: 120px;
        right: 10px;
        color: colors.$darkgray;
        cursor: pointer;
        z-index: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: color 0.2s;

        & :global(i) {
            display: block;
            margin-bottom: -2px;
        }
    }

    .orientationButtonActive {
        @extend .orientationButton;
        color: colors.$primary;
    }

    .positionButton {
        @include typography.size-22;
        position: absolute;
        width: 40px;
        padding: 10px;
        border: none;
        border-radius: 2px;
        background-color: white;
        box-shadow: 0 0 2px rgba(0, 0, 0, 0.2);
        bottom: 72px;
        right: 10px;
        color: colors.$primary;
        cursor: pointer;
        z-index: 1;
        display: flex;
        justify-content: center;
        align-items: center;

        & :global(i) {
            display: block;
            margin-bottom: -2px;
        }
    }
</style>
