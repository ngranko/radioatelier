<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {base} from '$app/paths';
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
        deactivatePreviousMarker();

        const icon = document.createElement('img');
        icon.src = `${base}/pointDefault.svg`;
        icon.style.transform = initialActive ? 'translate(0, 50%) scale(1.2)' : 'translate(0, 50%)';

        const {AdvancedMarkerElement, CollisionBehavior} = await $mapLoader.importLibrary('marker');

        marker = new AdvancedMarkerElement({
            map: $map,
            position: {lat: Number(lat), lng: Number(lng)},
            content: icon,
            collisionBehavior: CollisionBehavior.REQUIRED_AND_HIDES_OPTIONAL,
            gmpClickable: true,
        });
        marker.addListener('click', handleMarkerClick);
    });

    onDestroy(() => {
        marker.map = null;
    });

    function handleMarkerClick() {
        deactivatePreviousMarker();

        if (!$objectDetails.isSuccess) {
            activeObjectInfo.set({isLoading: true, object: {id, lat, lng}});
            $objectDetails.refetch();
        } else {
            activeObjectInfo.set({isLoading: false, object: $objectDetails.data.data.object});
        }
        (marker.content as HTMLElement).style.transform = 'translate(0, 50%) scale(1.2)';

        activeMarker.update(() => marker);
    }

    function deactivatePreviousMarker() {
        if ($activeMarker) {
            ($activeMarker.content as HTMLElement).style.transform = 'translate(0, 50%)';
        }
    }
</script>
