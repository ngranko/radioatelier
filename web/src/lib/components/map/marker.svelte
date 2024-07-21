<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {mapLoader, map, activeObjectInfo, activeMarker, dragTimeout} from '$lib/stores/map';
    import {createQuery, useQueryClient} from '@tanstack/svelte-query';
    import {getObject} from '$lib/api/object';
    import {useRepositionMutation} from '$lib/api/mutation/reposition';

    export let id: string | null = null;
    export let lat: string;
    export let lng: string;
    export let initialActive = false;
    let marker: google.maps.marker.AdvancedMarkerElement;
    let skipClick = false;
    let isDragged = false;
    let mouseMoveListener: google.maps.MapsEventListener | null = null;

    const client = useQueryClient();

    const objectDetails = createQuery({
        queryKey: ['object', {id: id ?? ''}],
        queryFn: getObject,
        enabled: false,
    });

    const reposition = useRepositionMutation(client);

    $: if ($objectDetails.isSuccess) {
        activeObjectInfo.set({
            isLoading: false,
            detailsId: $objectDetails.data.data.object.id,
            object: $objectDetails.data.data.object,
        });
    }

    $: if ($objectDetails.isError) {
        console.error($objectDetails.error);
    }

    onMount(async () => {
        activeMarker.deactivate();

        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa-solid fa-bolt" style="pointer-events:none;"></i>';
        icon.className = initialActive
            ? 'map-marker map-marker-appearing map-marker-active'
            : 'map-marker map-marker-appearing';

        const {AdvancedMarkerElement, CollisionBehavior} = await $mapLoader.importLibrary('marker');

        marker = new AdvancedMarkerElement({
            map: $map,
            position: {lat: Number(lat), lng: Number(lng)},
            content: icon,
            collisionBehavior: CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL,
            gmpClickable: true,
        });
        marker.addListener('click', handleMarkerClick);
        icon.addEventListener('mousedown', function () {
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

                    icon.classList.add('map-marker-draggable');
                    $map.set('draggable', false);
                    skipClick = true;
                }, 500),
            );
        });

        icon.addEventListener('mouseup', async () => {
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

            icon.classList.remove('map-marker-draggable');
        });

        setTimeout(
            () => (marker.content as HTMLDivElement).classList.remove('map-marker-appearing'),
            200,
        );
    });

    onDestroy(() => {
        (marker.content as HTMLDivElement).classList.add('map-marker-exiting');
        setTimeout(() => (marker.map = null), 200);
    });

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
                id: null,
                lat: String(marker.position!.lat),
                lng: String(marker.position!.lng),
            },
        }));
    }

    function handleMarkerClick() {
        if (skipClick) {
            skipClick = false;
            return;
        }

        if (!$objectDetails.isSuccess) {
            activeObjectInfo.set({isLoading: true, detailsId: id!, object: {id, lat, lng}});
            $objectDetails.refetch();
        } else {
            activeObjectInfo.set({
                isLoading: false,
                detailsId: $objectDetails.data.data.object.id,
                object: $objectDetails.data.data.object,
            });
        }

        activeMarker.deactivate();
        activeMarker.set(marker);
        activeMarker.activate();
    }
</script>

<style lang="scss">
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
        background-color: black;
        transition:
            transform 0.1s ease-in-out,
            opacity 0.1s ease-in-out;
    }

    :global(.map-marker-active) {
        transform: translate(0, 50%) scale(1.2);
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

    @keyframes -global-popIn {
        0% {
            transform: translate(0, 50%) scale(0);
        }
        100% {
            transform: translate(0, 50%) scale(1);
        }
    }
</style>
