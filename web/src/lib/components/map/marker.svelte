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
    import {toast} from 'svelte-sonner';
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

    let markerId: string = $state(id ?? `map-${Date.now()}-${Math.random()}`);
    let marker: MarkerObject | null = $state(null);
    let detailsRequestedForId: string | null = $state(null);
    let addressAppliedForKey: string | null = $state(null);

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
        if (!marker || !markerId || !mapState.markerManager) {
            return;
        }
        mapState.markerManager.updateMarkerState(markerId, {isVisited, isRemoved});
    });

    $effect(() => {
        if ($objectDetails.isSuccess && detailsRequestedForId) {
            const objectId = $objectDetails.data.data.object.id;
            if (objectId === detailsRequestedForId) {
                activeObject.isLoading = false;
                activeObject.isEditing = false;
                activeObject.isMinimized = false;
                activeObject.isDirty = false;
                activeObject.detailsId = objectId;
                activeObject.object = $objectDetails.data.data.object;
                detailsRequestedForId = null;
            }
        }

        if ($objectDetails.isError && detailsRequestedForId === id) {
            console.error($objectDetails.error);
            activeObject.isLoading = false;
            detailsRequestedForId = null;
        }
    });

    $effect(() => {
        if ($objectAddress.isSuccess) {
            const key = `${lat}|${lng}`;
            if (addressAppliedForKey === key) {
                return;
            }
            addressAppliedForKey = key;

            activeObject.isLoading = false;

            if (!activeObject.object) {
                console.warn('Address fetch completed but activeObject.object is not set');
                return;
            }

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

    $effect(() => {
        if (activeObject.detailsId === id && marker) {
            activeMarker.set(marker);
            activeMarker.activate();
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

        marker = mapState.markerManager.addMarker(markerId, position, {
            icon,
            color,
            isDraggable,
            source,
            isVisited,
            isRemoved,
            onClick: handleMarkerClick,
            onDragEnd: handleDragEnd,
        });

        if (source === 'map') {
            void $objectAddress.refetch();
            activeObject.isLoading = true;
            addressAppliedForKey = null;
        }
    }

    async function handleDragEnd() {
        const promise = updateObjectCoordinates();
        toast.promise(promise, {
            loading: 'Обновляю...',
            success: 'Позиция обновлена!',
            error: 'Не удалось обновить позицию',
        });
        await promise;
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
                detailsRequestedForId = id!;
            } else {
                activeObject.isLoading = false;
                activeObject.isEditing = false;
                activeObject.isMinimized = false;
                activeObject.isDirty = false;
                activeObject.detailsId = $objectDetails.data.data.object.id;
                activeObject.object = $objectDetails.data.data.object;
            }
        }
    }
</script>
