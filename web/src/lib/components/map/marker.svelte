<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {activeMarker, searchPointList} from '$lib/stores/map.ts';
    import {useQueryClient} from '@tanstack/svelte-query';
    import {useRepositionMutation} from '$lib/api/mutation/reposition';
    import {mapState} from '$lib/state/map.svelte';
    import {Marker as MarkerObject} from '$lib/services/map/marker';
    import type {MarkerSource} from '$lib/interfaces/marker';
    import {toast} from 'svelte-sonner';
    import {activeObject, resetActiveObject} from '$lib/state/activeObject.svelte.ts';
    import {setCenter} from '$lib/services/map/map.svelte.ts';
    import {goto, invalidate} from '$app/navigation';
    import {page} from '$app/state';
    import type {Object} from '$lib/interfaces/object.ts';

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

    const client = useQueryClient();

    const reposition = useRepositionMutation(client);

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
            await $reposition.mutateAsync({
                id: id!,
                updatedFields: {
                    lat: String(marker.getPosition().lat),
                    lng: String(marker.getPosition().lng),
                },
            });
            invalidate('/api/object/list');
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
            activeObject.object = {...$searchPointList[id!].object, isVisited, isRemoved};
        } else {
            if (!page.params.id) {
                goto(`/object/${id}`);
            } else {
                activeObject.isMinimized = false;
                activeObject.isDirty = false;

                if (page.data.activeObject) {
                    activeObject.detailsId = page.data.activeObject.id;
                    activeObject.object = page.data.activeObject;
                } else {
                    activeObject.isLoading = true;
                    activeObject.detailsId = id!;
                    page.data.activeObjectPromise
                        .then((object: Object) => {
                            activeObject.object = object;
                            activeObject.isLoading = false;
                        })
                        .catch(() => {
                            // TODO: probably better to just show an error, not redirect
                            goto('/');
                        });
                }
            }
        }
    }
</script>
