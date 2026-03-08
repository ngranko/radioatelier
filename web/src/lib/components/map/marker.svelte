<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {activeMarker, searchPointList} from '$lib/stores/map.ts';
    import {mapState} from '$lib/state/map.svelte';
    import {Marker as MarkerObject} from '$lib/services/map/marker';
    import type {MarkerSource} from '$lib/interfaces/marker';
    import {toast} from 'svelte-sonner';
    import {activeObject, resetActiveObject} from '$lib/state/activeObject.svelte.ts';
    import {setCenter} from '$lib/services/map/map.svelte.ts';
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {useConvexClient} from 'convex-svelte';
    import {api} from '$convex/_generated/api';
    import type {Id} from '$convex/_generated/dataModel';

    interface Props {
        id?: Id<'objects'> | null;
        lat: number;
        lng: number;
        isRemoved?: boolean;
        isVisited?: boolean;
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

    const client = useConvexClient();

    $effect(() => {
        if (!marker || !markerId || !mapState.markerManager) {
            return;
        }
        mapState.markerManager.updateMarkerState(markerId, {isVisited, isRemoved});
    });

    $effect(() => {
        if (activeObject.detailsId === id && marker) {
            activeMarker.set(marker);
            activeMarker.activate();
            setCenter(Number(lat), Number(lng));
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
            await client.mutation(api.objects.reposition, {
                id: id!,
                data: {
                    latitude: marker.getPosition().lat,
                    longitude: marker.getPosition().lng,
                },
            });
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
            activeObject.isMinimized = false;
            activeObject.isDirty = false;
            activeObject.detailsId = id!;
        } else {
            if (page.params.id === id && activeObject.detailsId === id) {
                activeObject.isMinimized = false;
                activeObject.isDirty = false;
                activeObject.isLoading = false;
                return;
            }

            activeObject.isMinimized = false;
            activeObject.isDirty = false;
            activeObject.isEditing = false;
            activeObject.isLoading = true;
            activeObject.detailsId = id!;
            goto(`/object/${id}`);
        }
    }
</script>
