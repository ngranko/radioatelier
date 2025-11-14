<script lang="ts">
    import {pointList, searchPointList} from '$lib/stores/map.js';
    import Marker from '$lib/components/map/marker.svelte';
    import UserMenu from '$lib/components/userMenu/userMenu.svelte';
    import LocationMarker from '$lib/components/map/locationMarker.svelte';
    import Search from '$lib/components/search/search.svelte';
    import {mapState} from '$lib/state/map.svelte';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';

    let orientationEnabled = $state(false);
</script>

<div class="menu absolute top-2 right-2 left-2 flex items-center justify-between gap-4">
    {#if mapState.map}
        <Search />
    {:else}
        <div></div>
    {/if}
    <UserMenu />
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

    {#each Object.keys($searchPointList) as id (id)}
        <Marker
            {id}
            lat={$searchPointList[id].object.lat}
            lng={$searchPointList[id].object.lng}
            icon={$searchPointList[id].object.type === 'local'
                ? 'fa-solid fa-magnifying-glass'
                : 'fa-brands fa-google'}
            color="#dc2626"
            source="search"
        />
    {/each}

    {#if activeObject.object && !activeObject.object.id}
        {#key `${activeObject.object.lat},${activeObject.object.lng}`}
            <Marker
                lat={activeObject.object.lat}
                lng={activeObject.object.lng}
                initialActive={true}
                icon="fa-solid fa-seedling"
                color="#000000"
                source="map"
            />
        {/key}
    {/if}
{/if}
