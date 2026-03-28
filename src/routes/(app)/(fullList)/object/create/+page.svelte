<script lang="ts">
    import {onMount, onDestroy} from 'svelte';
    import {page} from '$app/state';
    import {
        objectDetailsOverlay,
        showCreateDetailsOverlay,
    } from '$lib/state/objectDetailsOverlay.svelte.js';
    import {goto} from '$app/navigation';
    import {type LooseObject} from '$lib/interfaces/object';
    import {setCreateDraftPosition} from '$lib/state/createDraft.svelte.js';

    let {data} = $props();
    let isCreatePageActive = true;

    onMount(() => {
        const lat = page.url.searchParams.get('lat');
        const lng = page.url.searchParams.get('lng');

        if (!lat || !lng) {
            goto('/');
            return;
        }

        const latNum = Number(lat);
        const lngNum = Number(lng);

        let draft: Partial<LooseObject> = {
            id: null,
            latitude: latNum,
            longitude: lngNum,
            isVisited: false,
            isRemoved: false,
            isOwner: true,
        };
        setCreateDraftPosition({lat: latNum, lng: lngNum});
        showCreateDetailsOverlay(new Date().getTime().toString(), draft);

        data.streamed.address
            .then((address: {address?: string; city?: string; country?: string}) => {
                if (!isCreatePageActive) {
                    return;
                }
                draft = {...draft, ...address};
                objectDetailsOverlay.details = draft;
            })
            .finally(() => {
                if (!isCreatePageActive) {
                    return;
                }
                objectDetailsOverlay.isAddressLoading = false;
            });
    });

    onDestroy(() => {
        isCreatePageActive = false;
        setCreateDraftPosition(null);
    });
</script>
