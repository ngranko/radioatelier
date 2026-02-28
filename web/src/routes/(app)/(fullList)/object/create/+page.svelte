<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {page} from '$app/state';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import {
        setCreateDraftPosition,
        setCreateDraftInitialValues,
    } from '$lib/state/createDraft.svelte.ts';
    import {goto} from '$app/navigation';
    import {type LooseObject} from '$lib/interfaces/object';

    let {data} = $props();

    onMount(() => {
        const lat = page.url.searchParams.get('lat');
        const lng = page.url.searchParams.get('lng');

        if (!lat || !lng) {
            goto('/');
            return;
        }

        const latNum = Number(lat);
        const lngNum = Number(lng);

        activeObject.isMinimized = false;
        activeObject.isEditing = true;
        activeObject.isDirty = false;
        activeObject.detailsId = new Date().getTime().toString();
        activeObject.addressLoading = true;

        setCreateDraftPosition({lat: latNum, lng: lngNum});
        let draft: Partial<LooseObject> = {
            id: null,
            latitude: latNum,
            longitude: lngNum,
            isVisited: false,
            isRemoved: false,
            isOwner: true,
        };
        setCreateDraftInitialValues(draft);

        data.streamed.address
            .then((address: {address?: string; city?: string; country?: string}) => {
                draft = {...draft, ...address};
                setCreateDraftInitialValues(draft);
            })
            .finally(() => {
                activeObject.addressLoading = false;
            });
    });

    onDestroy(() => {
        setCreateDraftPosition(null);
        setCreateDraftInitialValues(null);
    });
</script>
