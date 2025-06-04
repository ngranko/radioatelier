<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {
        mapLoader,
        map,
        activeObjectInfo,
        activeMarker,
        dragTimeout,
        searchPointList,
    } from '$lib/stores/map';
    import {createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {getObject} from '$lib/api/object';
    import {useRepositionMutation} from '$lib/api/mutation/reposition';
    import {getAddress} from '$lib/api/location';
    import type {Object} from '$lib/interfaces/object';
    import CloseConfirmation from '$lib/components/objectDetails/closeConfirmation.svelte';
    import {clsx} from 'clsx';
    import {pointList} from '$lib/stores/map.js';
    import {setDraggable} from '$lib/services/map/map.svelte';

    interface Props {
        id?: string | null;
        lat: string;
        lng: string;
        isRemoved?: boolean;
        isVisited?: boolean;
        initialActive?: boolean;
        icon: string;
        color: string;
        isDraggable?: boolean;
        source: 'map' | 'list' | 'search';
    }

    let {
        id = null,
        lat,
        lng,
        isRemoved = false,
        isVisited = false,
        initialActive = false,
        icon,
        color,
        isDraggable = false,
        source,
    }: Props = $props();
    let marker: google.maps.marker.AdvancedMarkerElement | undefined = $state();
    let skipClick = false;
    let isDragged = false;
    let mouseMoveListener: google.maps.MapsEventListener | null = null;
    let isConfirmationOpen = $state(false);

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

    $effect(() => {
        // isLoading check is needed here because otherwise creating a duplicate marker for an object that was already open before will immediately trigger the details to open (TSK-286)
        if (
            $activeObjectInfo.isLoading &&
            $objectDetails.isSuccess &&
            $activeObjectInfo.detailsId === $objectDetails.data.data.object.id
        ) {
            activeObjectInfo.set({
                isLoading: false,
                isEditing: false,
                isMinimized: false,
                isDirty: false,
                detailsId: $objectDetails.data.data.object.id,
                object: $objectDetails.data.data.object,
            });
        }

        if ($objectDetails.isError) {
            console.error($objectDetails.error);
        }
    });

    $effect(() => {
        if ($objectAddress.isSuccess) {
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

        if ($objectAddress.isError) {
            console.error($objectAddress.error);
            activeObjectInfo.update(value => ({
                ...value,
                isLoading: false,
            }));
        }
    });

    $effect(() => {
        if (marker) {
            if (isVisited) {
                (marker.content as HTMLDivElement).classList.add('map-marker-visited');
            } else {
                (marker.content as HTMLDivElement).classList.remove('map-marker-visited');
            }

            if (isRemoved) {
                (marker.content as HTMLDivElement).classList.add('map-marker-removed');
            } else {
                (marker.content as HTMLDivElement).classList.remove('map-marker-removed');
            }
        }
    });

    onMount(async () => {
        const iconElement = document.createElement('div');
        iconElement.style.backgroundColor = color;
        iconElement.innerHTML = `<i class="${icon}" style="pointer-events:none;"></i>`;
        iconElement.className = getMarkerClassList();

        const {AdvancedMarkerElement, CollisionBehavior} = await $mapLoader.importLibrary('marker');

        if (
            id === null &&
            $activeObjectInfo.object &&
            !$activeObjectInfo.object.address &&
            !$activeObjectInfo.object.city &&
            !$activeObjectInfo.object.country
        ) {
            void $objectAddress.refetch();
            activeObjectInfo.update(value => ({
                ...value,
                isLoading: true,
            }));
        }

        marker = new AdvancedMarkerElement({
            map: $map,
            position: {lat: Number(lat), lng: Number(lng)},
            content: iconElement,
            collisionBehavior: CollisionBehavior.REQUIRED,
            gmpClickable: true,
            zIndex: source === 'search' ? 1 : 0,
        });

        marker.addListener('gmp-click', handleMarkerClick);

        if (isDraggable) {
            iconElement.addEventListener('mousedown', () =>
                handleClickStart('map-marker-draggable'),
            );
            iconElement.addEventListener('touchstart', () =>
                handleClickStart('map-marker-draggable-mobile'),
            );
            iconElement.addEventListener('mouseup', () => handleClickEnd('map-marker-draggable'));
            iconElement.addEventListener('touchend', () =>
                handleClickEnd('map-marker-draggable-mobile'),
            );
        }

        if (source === 'list') {
            pointList.update(id!, {marker});
        }

        if (source === 'search') {
            searchPointList.update(id!, {marker});
        }

        setTimeout(
            () => (marker?.content as HTMLDivElement).classList.remove('animate-popin'),
            200,
        );

        function handleClickStart(className: string) {
            dragTimeout.set(
                setTimeout(async () => {
                    const {event} = await $mapLoader.importLibrary('core');

                    mouseMoveListener = event.addListener(
                        $map!,
                        'mousemove',
                        function (evant: google.maps.MapMouseEvent) {
                            isDragged = true;
                            if (marker) {
                                marker.position = evant.latLng;
                            }
                        },
                    );

                    iconElement.classList.add(className);
                    setDraggable(false);
                    if ('vibrate' in navigator) {
                        navigator.vibrate(10);
                    }
                    skipClick = true;
                }, 500),
            );
        }

        async function handleClickEnd(className: string) {
            dragTimeout.remove();
            setDraggable(true);

            if (mouseMoveListener) {
                const {event} = await $mapLoader.importLibrary('core');
                event.removeListener(mouseMoveListener);
                mouseMoveListener = null;
            }

            if (isDragged) {
                isDragged = false;
                updateObjectCoordinates();
            }

            iconElement.classList.remove(className);
        }
    });

    onDestroy(() => {
        (marker?.content as HTMLDivElement).classList.add('animate-popout');
        setTimeout(() => (marker!.map = null), 200);
    });

    function getMarkerClassList() {
        return clsx([
            'map-marker',
            'animate-popin',
            {
                'map-marker-active': initialActive,
                'map-marker-visited': isVisited,
                'map-marker-removed': isRemoved,
            },
        ]);
    }

    function updateObjectCoordinates() {
        updateExistingObjectCoordinates();
    }

    async function updateExistingObjectCoordinates() {
        await $reposition.mutateAsync({
            id: id!,
            updatedFields: {
                lat: String(marker!.position!.lat),
                lng: String(marker!.position!.lng),
            },
        });
        pointList.updateCoordinates(
            id!,
            String(marker!.position!.lat),
            String(marker!.position!.lng),
        );
    }

    function handleMarkerClick() {
        if (skipClick) {
            skipClick = false;
            return;
        }

        changeActiveMarker();
    }

    function changeActiveMarker() {
        if (source === 'search' && $searchPointList[id!].object.id === null) {
            activeObjectInfo.set({
                isLoading: false,
                isEditing: false,
                isMinimized: false,
                isDirty: false,
                detailsId: id!,
                object: {...$searchPointList[id!].object, isVisited, isRemoved},
            });
        } else {
            if (!$objectDetails.isSuccess) {
                activeObjectInfo.set({
                    isLoading: true,
                    isEditing: false,
                    isMinimized: false,
                    isDirty: false,
                    detailsId: id!,
                    object: {id, lat, lng, isVisited, isRemoved},
                });
                $objectDetails.refetch();
            } else {
                activeObjectInfo.set({
                    isLoading: false,
                    isEditing: false,
                    isMinimized: false,
                    isDirty: false,
                    detailsId: $objectDetails.data.data.object.id,
                    object: $objectDetails.data.data.object,
                });
            }
        }

        activeMarker.set(marker!);
        activeMarker.activate();
    }
</script>

<CloseConfirmation bind:isOpen={isConfirmationOpen} onClick={changeActiveMarker} />

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

    :global(.map-marker-draggable) {
        opacity: 0.5;
        transform: translate(0, 50%) scale(1.2);
    }

    :global(.map-marker-draggable-mobile) {
        opacity: 0.5;
        transform: translate(0, -100%) scale(1.2);
    }
</style>
