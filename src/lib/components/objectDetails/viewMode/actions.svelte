<script lang="ts">
    import {toast} from 'svelte-sonner';
    import {getStreetView} from '$lib/services/map/streetView.svelte';
    import {Button} from '$lib/components/ui/button';
    import {objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import type {Permissions} from '$lib/interfaces/permissions';
    import PenIcon from '@lucide/svelte/icons/pen';
    import UserPenIcon from '@lucide/svelte/icons/user-pen';
    import RouteIcon from '@lucide/svelte/icons/route';
    import BinocularsIcon from '@lucide/svelte/icons/binoculars';

    interface Props {
        lat: string;
        lng: string;
        permissions?: Permissions;
    }

    let {lat, lng, permissions = {canEditAll: true, canEditPersonal: true}}: Props = $props();

    function handleEditClick() {
        if (!objectDetailsOverlay.detailsId) {
            return;
        }
        objectDetailsOverlay.isEditing = true;
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
        <Button variant="default" size="icon" onclick={handleEditClick}>
            <PenIcon class="fill-current" />
        </Button>
    {:else if permissions.canEditPersonal}
        <Button variant="default" size="icon" onclick={handleEditClick}>
            <UserPenIcon class="fill-current" />
        </Button>
    {/if}
    <Button
        variant="ghost"
        size="icon"
        class="text-muted-foreground hover:text-foreground"
        onclick={handleRouteClick}
    >
        <RouteIcon />
    </Button>
    <Button
        variant="ghost"
        size="icon"
        class="text-muted-foreground hover:text-foreground"
        onclick={handleStreetViewClick}
    >
        <BinocularsIcon />
    </Button>
</div>
