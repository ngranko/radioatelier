<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {
        mapLoader,
        map,
        activeObjectInfo,
        activeMarker,
        dragTimeout,
        markerList,
    } from '$lib/stores/map';
    import {createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {getObject} from '$lib/api/object';
    import {useRepositionMutation} from '$lib/api/mutation/reposition';
    import {getAddress} from '$lib/api/location';
    import type {Object} from '$lib/interfaces/object';
    import CloseConfirmation from '$lib/components/objectDetails/closeConfirmation.svelte';
    import {clsx} from 'clsx';

    export let id: string | null = null;
    export let lat: string;
    export let lng: string;
    export let isRemoved = false;
    export let isVisited = false;
    export let initialActive = false;
    let marker: google.maps.marker.AdvancedMarkerElement;
    let skipClick = false;
    let isDragged = false;
    let mouseMoveListener: google.maps.MapsEventListener | null = null;
    let isConfirmationOpen = false;

    const client = useQueryClient();

    const objectDetails = createQuery({
        queryKey: ['object', {id: id ?? ''}],
        queryFn: getObject,
        enabled: false,
    });

    const objectAddress = createQuery({
        queryKey: ['objectAddress', {lat, lng}],
        queryFn: getAddress,
        enabled: false,
    });

    const reposition = useRepositionMutation(client);

    $: if ($objectDetails.isSuccess) {
        activeObjectInfo.set({
            isLoading: false,
            isEditing: false,
            detailsId: $objectDetails.data.data.object.id,
            object: $objectDetails.data.data.object,
        });
    }

    $: if ($objectDetails.isError) {
        console.error($objectDetails.error);
    }

    $: if ($objectAddress.isSuccess) {
        activeObjectInfo.update(value => ({
            ...value,
            isLoading: false,
            object: {
                ...(value.object as Object),
                address: $objectAddress.data?.data.address ?? '',
                city: $objectAddress.data?.data.city ?? '',
                country: $objectAddress.data?.data.country ?? '',
            },
        }));
    }

    $: if ($objectAddress.isError) {
        console.error($objectAddress.error);
        activeObjectInfo.update(value => ({
            ...value,
            isLoading: false,
        }));
    }

    $: if (marker) {
        (marker.content as HTMLDivElement).className = getMarkerClassList();
    }

    onMount(async () => {
        activeMarker.deactivate();

        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa-solid fa-bolt" style="pointer-events:none;"></i>';
        icon.className = getMarkerClassList();

        const {AdvancedMarkerElement, CollisionBehavior} = await $mapLoader.importLibrary('marker');

        if (id === null) {
            void $objectAddress.refetch();
            activeObjectInfo.update(value => ({
                ...value,
                isLoading: true,
            }));
        }

        marker = new AdvancedMarkerElement({
            map: $map,
            position: {lat: Number(lat), lng: Number(lng)},
            content: icon,
            collisionBehavior: CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL,
            gmpClickable: true,
        });

        // if (
        //     ($map.getBounds() as google.maps.LatLngBounds).contains({
        //         lat: Number(lat),
        //         lng: Number(lng),
        //     })
        // ) {
        //     marker.map = $map;
        // }

        marker.addListener('click', handleMarkerClick);
        icon.addEventListener('mousedown', () => handleClickStart('map-marker-draggable'));
        icon.addEventListener('touchstart', () => handleClickStart('map-marker-draggable-mobile'));
        icon.addEventListener('mouseup', () => handleClickEnd('map-marker-draggable'));
        icon.addEventListener('touchend', () => handleClickEnd('map-marker-draggable-mobile'));

        if (id) {
            markerList.updateMarker(id, {marker});
        }

        setTimeout(
            () => (marker.content as HTMLDivElement).classList.remove('map-marker-appearing'),
            200,
        );

        function handleClickStart(className: string) {
            dragTimeout.set(
                setTimeout(async () => {
                    const {event} = await $mapLoader.importLibrary('core');

                    mouseMoveListener = event.addListener(
                        $map,
                        'mousemove',
                        function (evant: google.maps.MapMouseEvent) {
                            isDragged = true;
                            marker.position = evant.latLng;
                        },
                    );

                    icon.classList.add(className);
                    $map.set('draggable', false);
                    if ('vibrate' in navigator) {
                        navigator.vibrate(100);
                    }
                    skipClick = true;
                }, 500),
            );
        }

        async function handleClickEnd(className: string) {
            dragTimeout.remove();
            $map.set('draggable', true);

            if (mouseMoveListener) {
                const {event} = await $mapLoader.importLibrary('core');
                event.removeListener(mouseMoveListener);
                mouseMoveListener = null;
            }

            if (isDragged) {
                isDragged = false;
                updateObjectCoordinates();
            }

            icon.classList.remove(className);
        }
    });

    onDestroy(() => {
        (marker.content as HTMLDivElement).classList.add('map-marker-exiting');
        setTimeout(() => (marker.map = null), 200);
    });

    function getMarkerClassList() {
        return clsx([
            'map-marker',
            'map-marker-appearing',
            {
                'map-marker-active': initialActive,
                'map-marker-visited': isVisited,
                'map-marker-removed': isRemoved,
            },
        ]);
    }

    function updateObjectCoordinates() {
        if (id) {
            updateExistingObjectCoordinates();
        } else {
            updateNewObjectCoordinates();
        }
    }

    async function updateExistingObjectCoordinates() {
        await $reposition.mutateAsync({
            id: id!,
            updatedFields: {
                lat: String(marker.position!.lat),
                lng: String(marker.position!.lng),
            },
        });
    }

    function updateNewObjectCoordinates() {
        activeObjectInfo.update(value => ({
            ...value,
            object: {
                ...(value.object as Object),
                id: null,
                lat: String(marker.position!.lat),
                lng: String(marker.position!.lng),
            },
        }));
    }

    function handleMarkerClick() {
        if ($activeObjectInfo.object && $activeObjectInfo.object.id === id) {
            return;
        }

        if (skipClick) {
            skipClick = false;
            return;
        }

        if ($activeObjectInfo.isEditing) {
            isConfirmationOpen = true;
        } else {
            changeActiveMarker();
        }
    }

    function changeActiveMarker() {
        if (!$objectDetails.isSuccess) {
            activeObjectInfo.set({
                isLoading: true,
                isEditing: false,
                detailsId: id!,
                object: {id, lat, lng, isVisited, isRemoved},
            });
            $objectDetails.refetch();
        } else {
            activeObjectInfo.set({
                isLoading: false,
                isEditing: false,
                detailsId: $objectDetails.data.data.object.id,
                object: $objectDetails.data.data.object,
            });
        }

        activeMarker.deactivate();
        activeMarker.set(marker);
        activeMarker.activate();
    }
</script>

<CloseConfirmation bind:isOpen={isConfirmationOpen} on:click={changeActiveMarker} />

<style lang="scss">
    @use '../../../styles/colors';

    :global(.map-marker) {
        width: 24px;
        height: 24px;
        transform: translate(0, 50%);
        display: flex;
        justify-content: center;
        align-items: center;
        border-radius: 50%;
        font-size: 14px;
        color: white;
        background-color: colors.$black;
        transition:
            transform 0.1s ease-in-out,
            opacity 0.1s ease-in-out;
    }

    :global(.map-marker-active) {
        transform: translate(0, 50%) scale(1.2);
    }

    :global(.map-marker-visited) {
        color: colors.$secondary;
        text-shadow: 0 0 4px colors.$secondary;
    }

    :global(.map-marker-removed) {
        opacity: 0.5;
    }

    :global(.map-marker-appearing) {
        animation-name: popIn;
        animation-iteration-count: 1;
        animation-duration: 0.2s;
        animation-timing-function: cubic-bezier(0.92, 0.18, 0.8, 0.71);
    }

    :global(.map-marker-exiting) {
        animation-name: popIn;
        animation-direction: reverse;
        animation-iteration-count: 1;
        animation-duration: 0.2s;
        animation-timing-function: cubic-bezier(0.92, 0.18, 0.8, 0.71);
    }

    :global(.map-marker-draggable) {
        opacity: 0.5;
        transform: translate(0, 50%) scale(1.2);
    }

    :global(.map-marker-draggable-mobile) {
        opacity: 0.5;
        transform: translate(0, -100%) scale(1.2);
    }

    @keyframes -global-popIn {
        0% {
            transform: translate(0, 50%) scale(0);
        }
        100% {
            transform: translate(0, 50%) scale(1);
        }
    }
</style>
