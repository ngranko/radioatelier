<script lang="ts">
    import Address from '$lib/components/objectDetails/viewMode/address.svelte';
    import {Button} from '$lib/components/ui/button';
    import type {PointPreviewDetails} from '$lib/interfaces/object.ts';
    import {
        objectDetailsOverlay,
        showPointCreateOverlay,
    } from '$lib/state/objectDetailsOverlay.svelte.js';
    import PlusIcon from '@lucide/svelte/icons/plus';
    import NavigationActions from './viewMode/navigationActions.svelte';

    interface Props {
        details: PointPreviewDetails;
    }

    let {details}: Props = $props();

    const isAddressTitle = $derived(!details.name && details.type === 'map' && Boolean(details.address));
    const title = $derived(
        details.name || (isAddressTitle ? details.address : '') || 'Новая точка',
    );
    const address = $derived(isAddressTitle ? null : details.address);

    function handleCreateClick() {
        const draft = objectDetailsOverlay.details;
        if (!draft) {
            return;
        }
        showPointCreateOverlay(objectDetailsOverlay.detailsId, draft, details);
    }
</script>

<div class="bg-muted/40 flex items-center justify-between gap-2 border-b px-4 py-2.5">
    <Button class="gap-2 px-4" onclick={handleCreateClick}>
        <PlusIcon class="size-4" />
        Создать точку
    </Button>
    <div class="flex items-center gap-2">
        <NavigationActions lat={details.latitude} lng={details.longitude} />
    </div>
</div>

<div class="relative min-h-0 flex-1 space-y-3 overflow-x-hidden overflow-y-auto p-4">
    <div>
        {#if details.categoryName}
            <div class="text-muted-foreground text-sm">{details.categoryName}</div>
        {/if}
        <h1 class="text-foreground text-2xl/tight font-semibold wrap-break-word">{title}</h1>
    </div>

    {#if address || details.city || details.country}
        <Address {address} city={details.city} country={details.country} />
    {/if}
</div>
