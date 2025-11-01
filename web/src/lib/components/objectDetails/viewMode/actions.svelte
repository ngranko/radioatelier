<script lang="ts">
    import { toast } from 'svelte-sonner';
    import {getStreetView} from '$lib/services/map/streetView.svelte';
    import {Button} from '$lib/components/ui/button';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import type {Permissions} from '$lib/interfaces/permissions';

    interface Props {
        lat: string;
        lng: string;
        permissions?: Permissions;
    }

    let {lat, lng, permissions = {canEditAll: true, canEditPersonal: true}}: Props = $props();

    function handleEditClick() {
        activeObject.isEditing = true;
        activeObject.isDirty = false;
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

<div class="flex items-center justify-end gap-2 border-b bg-gray-50/50 px-4 py-2.5">
    {#if permissions.canEditAll}
        <Button
            variant="ghost"
            size="icon"
            class="bg-sky-600 text-base text-white hover:bg-sky-700 hover:text-white"
            onclick={handleEditClick}
        >
            <i class="fa-solid fa-pen"></i>
        </Button>
    {:else if permissions.canEditPersonal}
        <Button
            variant="ghost"
            size="icon"
            class="bg-sky-600 text-base text-white hover:bg-sky-700 hover:text-white"
            onclick={handleEditClick}
        >
            <i class="fa-solid fa-user-pen"></i>
        </Button>
    {/if}
    <Button
        variant="ghost"
        size="icon"
        class="text-base text-gray-600 hover:bg-gray-100 hover:text-gray-700"
        onclick={handleRouteClick}
    >
        <i class="fa-solid fa-route"></i>
    </Button>
    <Button
        variant="ghost"
        size="icon"
        class="text-base text-gray-600 hover:bg-gray-100 hover:text-gray-700"
        onclick={handleStreetViewClick}
    >
        <i class="fa-solid fa-street-view"></i>
    </Button>
</div>
