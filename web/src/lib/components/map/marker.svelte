<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {activeMarker, searchPointList} from '$lib/stores/map';
    import {createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {getObject} from '$lib/api/object';
    import {useRepositionMutation} from '$lib/api/mutation/reposition';
    import {getAddress} from '$lib/api/location';
    import type {Object} from '$lib/interfaces/object';
    import {pointList} from '$lib/stores/map.js';
    import {mapState} from '$lib/state/map.svelte';
    import {Marker as MarkerObject} from '$lib/services/map/marker';
    import type {MarkerSource} from '$lib/interfaces/marker';
    import toast from 'svelte-5-french-toast';
    import {activeObject, resetActiveObject} from '$lib/state/activeObject.svelte.ts';

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
        source: MarkerSource;
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
    let marker: MarkerObject | null = $state(null);

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
        if (!markerId || !mapState.markerManager) {
            return;
        }
        mapState.markerManager.updateMarkerState(markerId, {isVisited, isRemoved});
    });

    $effect(() => {
        if (!marker) {
            return;
        }

        // isLoading check is needed here because otherwise creating a duplicate marker for an object that was already open before will immediately trigger the details to open (TSK-286)
        // TODO: maybe I need to deal with this error by just emptying the activeObject if I delete a marker with the same ID?
        if (
            activeObject.isLoading &&
            $objectDetails.isSuccess &&
            activeObject.detailsId === $objectDetails.data.data.object.id
        ) {
            activeObject.isLoading = false;
            activeObject.isEditing = false;
            activeObject.isMinimized = false;
            activeObject.isDirty = false;
            activeObject.detailsId = $objectDetails.data.data.object.id;
            activeObject.object = $objectDetails.data.data.object;
        }

        if ($objectDetails.isError) {
            console.error($objectDetails.error);
            // Set loading to false on error to prevent a stuck loading state
            if (activeObject.isLoading && activeObject.detailsId === id) {
                activeObject.isLoading = false;
            }
        }
    });

    $effect(() => {
        if ($objectAddress.isSuccess) {
            activeObject.isLoading = false;
            activeObject.object = {
                ...(activeObject.object as Object),
                address: $objectAddress.data?.data.address ?? '',
                city: $objectAddress.data?.data.city ?? '',
                country: $objectAddress.data?.data.country ?? '',
            };
        }

        if ($objectAddress.isError) {
            console.error($objectAddress.error);
            activeObject.isLoading = false;
        }
    });

    onMount(() => {
        createMarker();
    });

    function createMarker() {
        if (!mapState.markerManager) {
            console.error(
                'marker manager not instantiated when trying to create a marker; this is a noop',
            );
            return;
        }

        const position = {lat: Number(lat), lng: Number(lng)};

        // For map-clicked markers, pass a unique ID to avoid cache conflicts
        markerId = id ?? `map-${Date.now()}-${Math.random()}`;

        marker = mapState.markerManager.addMarker(markerId, position, {
            icon,
            color,
            isDraggable,
            source,
            onClick: handleMarkerClick,
            onDragEnd: handleDragEnd,
        });

        if (source === 'map') {
            void $objectAddress.refetch();
            activeObject.isLoading = true;
        }
    }

    async function handleDragEnd() {
        await toast.promise(updateObjectCoordinates(), {
            loading: 'Обновляю...',
            success: 'Позиция обновлена!',
            error: 'Не удалось обновить позицию',
        });
    }

    onDestroy(() => {
        if (mapState.markerManager) {
            mapState.markerManager.removeMarker(markerId!);
        }

        if (activeObject.detailsId === id) {
            resetActiveObject();
        }
    });

    async function updateObjectCoordinates() {
        if (!marker) {
            return;
        }

        try {
            await $reposition.mutateAsync({
                id: id!,
                updatedFields: {
                    lat: String(marker.getPosition().lat),
                    lng: String(marker.getPosition().lng),
                },
            });
            pointList.updateCoordinates(
                id!,
                String(marker.getPosition().lat),
                String(marker.getPosition().lng),
            );
        } catch (error) {
            marker.revertPosition();
            throw error;
        }
    }

    function handleMarkerClick() {
        changeActiveMarker();
    }

    function changeActiveMarker() {
        if (source === 'search' && $searchPointList[id!].object.id === null) {
            activeObject.isLoading = false;
            activeObject.isEditing = false;
            activeObject.isMinimized = false;
            activeObject.isDirty = false;
            activeObject.detailsId = id!;
            activeObject.object = {...$searchPointList[id!].object, isVisited, isRemoved};
        } else {
            if (!$objectDetails.isSuccess) {
                activeObject.isLoading = true;
                activeObject.isEditing = false;
                activeObject.isMinimized = false;
                activeObject.isDirty = false;
                activeObject.detailsId = id!;
                activeObject.object = {id, lat, lng, isVisited, isRemoved};
                $objectDetails.refetch();
            } else {
                activeObject.isLoading = false;
                activeObject.isEditing = false;
                activeObject.isMinimized = false;
                activeObject.isDirty = false;
                activeObject.detailsId = $objectDetails.data.data.object.id;
                activeObject.object = $objectDetails.data.data.object;
            }
        }

        activeMarker.set(marker);
        activeMarker.activate();
    }
</script>
