<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {
        mapLoader,
        map,
        markerManager,
        activeObjectInfo,
        activeMarker,
        searchPointList,
    } from '$lib/stores/map';
    import {createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {getObject} from '$lib/api/object';
    import {useRepositionMutation} from '$lib/api/mutation/reposition';
    import {getAddress} from '$lib/api/location';
    import type {Object} from '$lib/interfaces/object';
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
        icon,
        color,
        isDraggable = false,
        source,
    }: Props = $props();

    let markerId: string | undefined = $state();
    let marker: google.maps.marker.AdvancedMarkerElement | undefined = $state();
    let skipClick = false;
    let isDragged = false;
    let mouseMoveListener: google.maps.MapsEventListener | null = null;
    let boundsListener: google.maps.MapsEventListener | null = null;
    let markerElement: HTMLDivElement | undefined = $state();

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
        if (!marker) {
            return;
        }

        // Update marker appearance based on state
        if (markerElement) {
            markerElement.classList.toggle('map-marker-visited', isVisited);
            markerElement.classList.toggle('map-marker-removed', isRemoved);
        }
    });

    $effect(() => {
        if (!marker) {
            return;
        }

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
        if (!marker) {
            return;
        }

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

    onMount(async () => {
        await createMarker();
    });

    async function createMarker() {
        const position = {lat: Number(lat), lng: Number(lng)};

        // For map-clicked markers, pass a unique ID to avoid cache conflicts
        markerId = source === 'map' ? `map-${Date.now()}-${Math.random()}` : id!;

        marker = await $markerManager!.createMarker(markerId, position, {
            icon,
            color,
            isDraggable,
            source,
            onClick: handleMarkerClick,
            onDragStart: handleClickStart,
            onDragEnd: handleClickEnd,
            onDragMove: event => {
                isDragged = true;
                if (marker) {
                    marker.position = event.latLng;
                }
            },
        });

        if (source === 'list') {
            pointList.update(id!, {marker});
        }

        if (source === 'search') {
            searchPointList.update(id!, {marker});
        }

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
    }

    async function handleClickStart() {
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

        setDraggable(false);
        if ('vibrate' in navigator) {
            navigator.vibrate(10);
        }
        skipClick = true;
    }

    async function handleClickEnd() {
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
    }

    onDestroy(() => {
        // Cleanup bounds listener
        if (boundsListener) {
            google.maps.event.removeListener(boundsListener);
        }

        if ($markerManager) {
            $markerManager.removeMarker(markerId!);
        }
    });

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
