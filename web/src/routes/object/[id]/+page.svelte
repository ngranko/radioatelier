<script lang="ts">
    import {createQuery} from '@tanstack/svelte-query';
    import Map from '$lib/components/map/map.svelte';
    import Marker from '$lib/components/map/marker.svelte';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';
    import LocationMarker from '$lib/components/map/locationMarker.svelte';
    import {me} from '$lib/api/user';
    import {webgl2Adapter} from '@luma.gl/webgl';
    import {mapState} from '$lib/state/map.svelte';
    import PositionButton from '$lib/components/map/positionButton.svelte';
    import OrientationButton from '$lib/components/map/orientationButton.svelte';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {getObject} from '$lib/api/object.ts';
    import {page} from '$app/state';
    import {setCenter} from '$lib/services/map/map.svelte.ts';
    import {pointList} from '$lib/stores/map.ts';

    // this is needed to avoid deck.gl error
    webgl2Adapter;

    const id = page.params.id;

    let orientationEnabled = $state(false);
    let consoleElement: HTMLElement | undefined = $state();
    let initialDetailsOpen = $state(false);

    const objectDetails = createQuery({
        queryKey: ['object', {id}],
        queryFn: getObject,
    });

    $effect(() => {
        if ($objectDetails.isSuccess && !initialDetailsOpen) {
            pointList.add({object: $objectDetails.data.data.object});
            activeObject.detailsId = id;
            activeObject.object = $objectDetails.data.data.object;
            setCenter(
                Number($objectDetails.data.data.object.lat),
                Number($objectDetails.data.data.object.lng),
            );
            initialDetailsOpen = true;
        }
    });

    const meQuery = createQuery({queryKey: ['me'], queryFn: me});
    $effect(() => {
        if ($meQuery.isSuccess && $meQuery.data.data.role === 'admin') {
            import('eruda').then(eruda =>
                eruda.default.init({container: consoleElement, tool: ['console', 'elements']}),
            );
        }
    });
</script>

<div bind:this={consoleElement}></div>

<OrientationButton />
<PositionButton />

<div class="menu absolute top-4 right-4 left-4 flex items-center justify-end gap-4">
    <a
        href="https://radioatelier.one"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Перейти на лендинг"
        class="group relative z-2 flex h-16 w-16 items-center justify-center rounded-2xl bg-white shadow-lg transition-colors duration-150 ease-out hover:bg-neutral-50 hover:shadow-xl focus-visible:bg-neutral-50 focus-visible:shadow-xl"
    >
        <span
            aria-hidden="true"
            class="mt-1 pointer-events-none block h-[calc(100%-1.2rem)] w-[calc(100%-1.2rem)] bg-primary transition-colors duration-150 ease-out group-hover:bg-primary group-focus-visible:bg-primary"
            style="
                mask-image: url('/logo.svg');
                mask-repeat: no-repeat;
                mask-position: center;
                mask-size: contain;
                -webkit-mask-image: url('/logo.svg');
                -webkit-mask-repeat: no-repeat;
                -webkit-mask-position: center;
                -webkit-mask-size: contain;
            "
        ></span>
    </a>
</div>

{#if activeObject.object}
    <ObjectDetails
        initialValues={activeObject.object}
        key={activeObject.detailsId}
        isLoading={activeObject.isLoading}
        isEditing={activeObject.isEditing}
        permissions={{canEditAll: false, canEditPersonal: false}}
    />
{/if}

<Map />
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
