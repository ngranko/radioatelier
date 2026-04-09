<script lang="ts">
    import OrientationButton from '$lib/components/map/orientationButton.svelte';
    import PositionButton from '$lib/components/map/positionButton.svelte';
    import {webgl2Adapter} from '@luma.gl/webgl';
    import type {LayoutProps} from './$types';
    import Map from '$lib/components/map/map.svelte';
    import type {Location} from '$lib/interfaces/location.ts';
    import {createDraftState, setCreateDraftPosition} from '$lib/state/createDraft.svelte.ts';
    import {searchPointList} from '$lib/state/searchPointList.svelte.ts';
    import {mapState} from '$lib/state/map.svelte.ts';
    import LocationMarker from '$lib/components/map/locationMarker.svelte';
    import Marker from '$lib/components/map/marker.svelte';
    import UserMenu from '$lib/components/userMenu/userMenu.svelte';
    import Search from '$lib/components/search/search.svelte';
    import {sharedMarker} from '$lib/state/sharedMarker.svelte.ts';
    import {goto} from '$app/navigation';
    import {page} from '$app/state';
    import {useClerkContext} from 'svelte-clerk';
    import {showLoadingDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import SearchIcon from '@lucide/svelte/icons/search';
    import StarIcon from '@lucide/svelte/icons/star';
    import SproutIcon from '@lucide/svelte/icons/sprout';
    import {useQuery} from 'convex-svelte';
    import {api} from '$convex/_generated/api';
    import {setCategories} from '$lib/state/categories.svelte';

    // this is needed to avoid deck.gl error
    // eslint-disable-next-line @typescript-eslint/no-unused-expressions
    webgl2Adapter;

    let {children, data}: LayoutProps = $props();

    let consoleElement: HTMLElement | undefined = $state();
    let orientationEnabled = $state(false);
    const clerkCtx = useClerkContext();

    const categories = useQuery(api.categories.list, {}, () => ({initialData: data.categories}));

    function handleMapClick(location: Location) {
        if (!clerkCtx.auth.userId) {
            return;
        }

        setCreateDraftPosition({lat: location.lat, lng: location.lng});

        showLoadingDetailsOverlay(new Date().getTime().toString());
        goto(`/object/create?lat=${location.lat}&lng=${location.lng}`);
    }

    $effect(() => {
        setCategories(categories.data ?? data.categories);
    });

    $effect(() => {
        if (!clerkCtx.isLoaded) {
            return;
        }
        if (clerkCtx.session?.currentTask?.key !== 'reset-password') {
            return;
        }
        const ref = `${page.url.pathname}${page.url.search}`;
        goto(`/login/reset-password?ref=${encodeURIComponent(ref)}`);
    });

    // uncomment if mobile dev tools are required
    // $effect(() => {
    //     if (currentUser.auth && currentUser.profile?.role === 'admin') {
    //         import('eruda').then(eruda =>
    //             eruda.default.init({container: consoleElement, tool: ['console', 'elements']}),
    //         );
    //     } else {
    //         if (consoleElement) {
    //             consoleElement.innerHTML = '';
    //         }
    //     }
    // });
</script>

<div bind:this={consoleElement}></div>

<div class="menu absolute top-2 right-4 left-2 flex items-center justify-between gap-4">
    {#if mapState.isReady && clerkCtx.auth.userId}
        <Search />
    {:else}
        <div></div>
    {/if}
    <UserMenu />
</div>

<Map onClick={handleMapClick} />

<OrientationButton bind:isEnabled={orientationEnabled} />
<PositionButton />

{@render children?.()}

{#if mapState.isReady}
    <LocationMarker {orientationEnabled} />

    {#each Object.keys(searchPointList) as searchPointId (searchPointId)}
        {@const searchPoint = searchPointList[searchPointId]}
        {#if searchPoint?.object}
            <Marker
                id={searchPoint.object.id}
                {searchPointId}
                lat={searchPoint.object.latitude}
                lng={searchPoint.object.longitude}
                icon={searchPoint.object.type === 'local' ? SearchIcon : 'fa-brands fa-google'}
                iconClassName="stroke-3"
                color="#e11d48"
                source="search"
            />
        {/if}
    {/each}

    {#if sharedMarker.object}
        {#key sharedMarker.object.id}
            <Marker
                id={sharedMarker.object.id}
                lat={sharedMarker.object.latitude}
                lng={sharedMarker.object.longitude}
                icon={StarIcon}
                iconClassName="fill-current"
                color="#d97706"
                source="share"
            />
        {/key}
    {/if}

    {#if createDraftState.position}
        {#key `${createDraftState.position.lat},${createDraftState.position.lng}`}
            <Marker
                lat={createDraftState.position.lat}
                lng={createDraftState.position.lng}
                icon={SproutIcon}
                iconClassName="fill-current"
                color="#000000"
                source="map"
            />
        {/key}
    {/if}
{/if}
