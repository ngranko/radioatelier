<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import type {Permissions} from '$lib/interfaces/permissions';
    import {enterEditMode, objectDetailsOverlay} from '$lib/state/objectDetailsOverlay.svelte';
    import PenIcon from '@lucide/svelte/icons/pen';
    import UserPenIcon from '@lucide/svelte/icons/user-pen';
    import NavigationActions from './navigationActions.svelte';
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
    <NavigationActions lat={Number(lat)} lng={Number(lng)} />
    {#if id}
        <ShareButton {id} {name} />
    {/if}
</div>
