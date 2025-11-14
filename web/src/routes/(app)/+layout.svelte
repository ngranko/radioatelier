<script lang="ts">
    import OrientationButton from '$lib/components/map/orientationButton.svelte';
    import PositionButton from '$lib/components/map/positionButton.svelte';
    import {webgl2Adapter} from '@luma.gl/webgl';
    import type {LayoutProps} from './$types';
    import Map from '$lib/components/map/map.svelte';
    import type {Location} from '$lib/interfaces/location.ts';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import ObjectDetails from '$lib/components/objectDetails/objectDetails.svelte';
    import {onMount} from 'svelte';
    import {pointList} from '$lib/stores/map.ts';

    // this is needed to avoid deck.gl error
    webgl2Adapter;

    let {data, children}: LayoutProps = $props();

    let consoleElement: HTMLElement | undefined = $state();

    console.log(data);

    function handleMapClick(location: Location) {
        if (!data.user.auth) {
            return;
        }

        activeObject.isLoading = false;
        activeObject.isMinimized = false;
        activeObject.isEditing = true;
        activeObject.isDirty = false;
        activeObject.detailsId = new Date().getTime().toString();
        activeObject.object = {
            id: null,
            lat: String(location.lat),
            lng: String(location.lng),
            isVisited: false,
            isRemoved: false,
        };
    }

    onMount(() => {
        if (data.user.auth && data.user.profile?.role === 'admin') {
            import('eruda').then(eruda =>
                eruda.default.init({container: consoleElement, tool: ['console', 'elements']}),
            );
        }

        pointList.set(data.objects.map(object => ({object})));
    });
</script>

<div bind:this={consoleElement}></div>

{#if activeObject.object}
    <ObjectDetails
        initialValues={activeObject.object}
        key={activeObject.detailsId}
        isLoading={activeObject.isLoading}
        isEditing={activeObject.isEditing}
        permissions={{canEditAll: false, canEditPersonal: false}}
    />
{/if}

<Map onClick={handleMapClick} />

<OrientationButton />
<PositionButton />

{@render children?.()}
