<script lang="ts">
    import {toast} from 'svelte-sonner';
    import {Button} from '$lib/components/ui/button';
    import Address from '$lib/components/objectDetails/viewMode/address.svelte';
    import type {PointPreviewDetails} from '$lib/interfaces/object.ts';
    import {getStreetView} from '$lib/services/map/streetView.svelte';
    import {
        objectDetailsOverlay,
        showPointCreateOverlay,
    } from '$lib/state/objectDetailsOverlay.svelte.js';
    import BinocularsIcon from '@lucide/svelte/icons/binoculars';
    import RouteIcon from '@lucide/svelte/icons/route';
    import PlusIcon from '@lucide/svelte/icons/plus';

    interface Props {
        details: PointPreviewDetails;
    }

    let {details}: Props = $props();

    const title = $derived(
        details.name || (details.type === 'map' ? details.address : '') || 'Новая точка',
    );
    const coordinates = $derived(`${details.latitude.toFixed(5)}, ${details.longitude.toFixed(5)}`);

    function handleCreateClick() {
        const draft = objectDetailsOverlay.details;
        if (!draft) {
            return;
        }
        showPointCreateOverlay(objectDetailsOverlay.detailsId, draft, details);
    }

    function handleRouteClick() {
        window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${details.latitude},${details.longitude}&dir_action=navigate`;
    }

    function handleStreetViewClick() {
        getStreetView(details.latitude, details.longitude).catch(error => {
            console.error(error);
            toast.error('Нет панорамы для этой точки');
        });
    }
</script>

<div class="bg-muted/40 flex items-center justify-between gap-2 border-b px-4 py-2.5">
    <Button class="gap-2 px-4" onclick={handleCreateClick}>
        <PlusIcon class="size-4" />
        Создать точку
    </Button>
    <div class="flex items-center gap-2">
        <Button
            variant="ghost"
            size="icon"
            class="text-muted-foreground hover:text-foreground"
            onclick={handleRouteClick}
            aria-label="Проложить маршрут"
            title="Проложить маршрут"
        >
            <RouteIcon />
        </Button>
        <Button
            variant="ghost"
            size="icon"
            class="text-muted-foreground hover:text-foreground"
            onclick={handleStreetViewClick}
            aria-label="Открыть панораму"
            title="Открыть панораму"
        >
            <BinocularsIcon />
        </Button>
    </div>
</div>

<div class="relative h-[calc(100vh-8px*2-57px*2)] space-y-3 overflow-x-hidden overflow-y-auto p-4">
    <div>
        <div class="text-muted-foreground text-sm">
            {#if details.type === 'google'}
                Google Place
            {:else}
                Координаты
            {/if}
            {#if details.categoryName}
                &middot; {details.categoryName}
            {/if}
        </div>
        <h1 class="text-foreground text-2xl leading-tight font-semibold">{title}</h1>
    </div>

    {#if details.address || details.city || details.country}
        <Address address={details.address} city={details.city} country={details.country} />
    {/if}

    <div class="text-muted-foreground text-sm">{coordinates}</div>
</div>
