<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {mapLoader, map, activeObjectInfo, activeMarker} from '$lib/stores/map';
    import {createQuery} from '@tanstack/svelte-query';
    import {getObject} from '$lib/api/object';

    export let id: string | null = null;
    export let lat: string;
    export let lng: string;
    export let initialActive = false;
    let marker: google.maps.marker.AdvancedMarkerElement;

    const objectDetails = createQuery({
        queryKey: ['object', {id: id ?? ''}],
        queryFn: getObject,
        enabled: false,
    });

    $: if ($objectDetails.isSuccess) {
        console.log('object details fetch successful');
        activeObjectInfo.set({isLoading: false, object: $objectDetails.data.data.object});
    }

    $: if ($objectDetails.isError) {
        console.error($objectDetails.error);
    }

    onMount(async () => {
        activeMarker.deactivate();

        const icon = document.createElement('div');
        icon.innerHTML = '<i class="fa-solid fa-bolt"></i>';
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

        setTimeout(
            () => (marker.content as HTMLDivElement).classList.remove('map-marker-appearing'),
            200,
        );
    });

    onDestroy(() => {
        (marker.content as HTMLDivElement).classList.add('map-marker-exiting');
        setTimeout(() => (marker.map = null), 200);
    });

    function handleMarkerClick() {
        if (!$objectDetails.isSuccess) {
            activeObjectInfo.set({isLoading: true, object: {id, lat, lng}});
            $objectDetails.refetch();
        } else {
            activeObjectInfo.set({isLoading: false, object: $objectDetails.data.data.object});
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
        transition: transform 0.1s ease-in-out;
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

    @keyframes -global-popIn {
        0% {
            transform: translate(0, 50%) scale(0);
        }
        100% {
            transform: translate(0, 50%) scale(1);
        }
    }
</style>
