<script lang="ts">
    import {createQuery} from '@tanstack/svelte-query';
    import Marker from '$lib/components/map/marker.svelte';
    import LocationMarker from '$lib/components/map/locationMarker.svelte';
    import {mapState} from '$lib/state/map.svelte';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {getObject} from '$lib/api/object.ts';
    import {page} from '$app/state';
    import {setCenter} from '$lib/services/map/map.svelte.ts';
    import {pointList} from '$lib/stores/map.ts';

    const id = page.params.id;

    let orientationEnabled = $state(false);
    let initialDetailsOpen = $state(false);

    const objectDetails = createQuery({
        queryKey: ['object', {id}],
        queryFn: getObject,
    });

    $effect(() => {
        if ($objectDetails.isSuccess && !initialDetailsOpen) {
            activeObject.detailsId = id;
            activeObject.object = $objectDetails.data.data.object;
            if (!$pointList[$objectDetails.data.data.object.id]) {
                pointList.add({object: $objectDetails.data.data.object});
            }
            setCenter(
                Number($objectDetails.data.data.object.lat),
                Number($objectDetails.data.data.object.lng),
            );

            initialDetailsOpen = true;
        }
    });
</script>

<div class="menu absolute top-4 right-4 left-4 flex items-center justify-end gap-4">
    <a
        href="https://archive.radioatelier.one"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Перейти на лендинг"
        class="group focus-visible:ring-primary focus-visible:ring-opacity-40 relative z-2 flex h-12 w-12 items-center justify-center rounded-xl bg-white/85 shadow-md ring-1 ring-black/5 backdrop-blur transition-all duration-200 ease-out hover:bg-white hover:shadow-lg hover:ring-black/10 focus-visible:bg-white focus-visible:shadow-lg focus-visible:ring-2"
    >
        <span
            aria-hidden="true"
            class="bg-primary/90 group-hover:bg-primary group-focus-visible:bg-primary pointer-events-none block h-[calc(100%-0.9rem)] w-[calc(100%-0.9rem)] transition-transform duration-200 ease-out"
            style="
                mask-image: url('/logo.svg');
                mask-repeat: no-repeat;
                mask-position: center;
                mask-size: contain;
                -webkit-mask-image: url('/logo.svg');
                -webkit-mask-repeat: no-repeat;
                -webkit-mask-position: center;
                -webkit-mask-size: contain;
                filter: brightness(0.8);
            "
        ></span>
    </a>
</div>

{#if mapState.map}
    <LocationMarker {orientationEnabled} />

    {#each Object.values($pointList) as point (point.object.id)}
        <Marker
            id={point.object.id}
            lat={point.object.lat}
            lng={point.object.lng}
            isVisited={point.object.isVisited}
            isRemoved={point.object.isRemoved}
            isDraggable={point.object.isOwner}
            icon="fa-solid fa-bolt"
            color="#000000"
            source="list"
        />
    {/each}
{/if}
