<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import type {Permissions} from '$lib/interfaces/permissions';
    import {getStreetView} from '$lib/services/map/streetView.svelte';
    import {enterEditMode, objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import BinocularsIcon from '@lucide/svelte/icons/binoculars';
    import PenIcon from '@lucide/svelte/icons/pen';
    import RouteIcon from '@lucide/svelte/icons/route';
    import UserPenIcon from '@lucide/svelte/icons/user-pen';
    import {toast} from 'svelte-sonner';
    import ShareButton from './shareButton.svelte';

    interface Props {
        id?: string;
        name?: string;
        lat: string;
        lng: string;
        permissions?: Permissions;
    }

    let {
        id,
        name,
        lat,
        lng,
        permissions = {canEditAll: true, canEditPersonal: true},
    }: Props = $props();

    function handleEditClick() {
        if (!objectDetailsOverlay.detailsId) {
            return;
        }
        enterEditMode();
    }

    function handleRouteClick() {
        window.location.href = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&dir_action=navigate`;
    }

    function handleStreetViewClick() {
        getStreetView(Number(lat), Number(lng)).catch(error => {
            console.error(error);
            toast.error('Нет панорамы для этой точки');
        });
    }
</script>

<div class="bg-muted/40 flex items-center justify-end gap-2 border-b px-4 py-2.5">
    {#if permissions.canEditAll}
        <Button
            variant="default"
            size="icon"
            onclick={handleEditClick}
            aria-label="Редактировать точку"
            title="Редактировать точку"
        >
            <PenIcon class="fill-current" />
        </Button>
    {:else if permissions.canEditPersonal}
        <Button
            variant="default"
            size="icon"
            onclick={handleEditClick}
            aria-label="Редактировать личные отметки"
            title="Редактировать личные отметки"
        >
            <UserPenIcon class="fill-current" />
        </Button>
    {/if}
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
    {#if id}
        <ShareButton {id} {name} />
    {/if}
</div>
