<script lang="ts">
    import {fly} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import type {LooseObject, Object} from '$lib/interfaces/object';
    import Form from '$lib/components/objectDetails/editMode/form.svelte';
    import LightForm from '$lib/components/objectDetails/editMode/lightForm.svelte';
    import ViewMode from '$lib/components/objectDetails/viewMode/viewMode.svelte';
    import {activeMarker} from '$lib/stores/map';
    import {Button} from '$lib/components/ui/button';
    import CloseButton from './closeButton.svelte';
    import Background from './background.svelte';
    import {mapState} from '$lib/state/map.svelte';
    import {cn} from '$lib/utils.ts';
    import {activeObject, resetActiveObject} from '$lib/state/activeObject.svelte.ts';
    import type {Permissions} from '$lib/interfaces/permissions';
    import {goto} from '$app/navigation';
    import {page} from '$app/state';

    interface Props {
        key: string;
        initialValues: Partial<LooseObject>;
        isLoading?: boolean;
        isEditing?: boolean;
        permissions?: Permissions;
    }

    let {
        key,
        initialValues = $bindable(),
        isLoading = false,
        isEditing = false,
        permissions = {canEditAll: true, canEditPersonal: true},
    }: Props = $props();

    const canEditAll = $derived.by(() => {
        if (initialValues.id === null) {
            return permissions.canEditAll;
        }

        const isOwner =
            initialValues.isOwner ?? (activeObject.object as Object | null)?.isOwner ?? false;
        return permissions.canEditAll && isOwner;
    });

    const canEditPersonal = $derived.by(() => {
        if (initialValues.id === null) {
            return permissions.canEditPersonal;
        }

        const isOwner =
            initialValues.isOwner ?? (activeObject.object as Object | null)?.isOwner ?? false;
        return permissions.canEditPersonal && !isOwner;
    });

    function handleMinimizeClick() {
        activeObject.isMinimized = !activeObject.isMinimized;
    }

    function handleClose() {
        if (!activeObject.object) {
            return;
        }

        activeMarker.deactivate();
        activeMarker.set(null);
        resetActiveObject();
        if (mapState.map) {
            mapState.map.getStreetView().setVisible(false);
        }

        if (page.data.user.auth) {
            goto('/');
        } else {
            activeObject.object = null;
            activeObject.detailsId = '';
            activeObject.isDirty = false;
            activeObject.isEditing = false;
            activeObject.isLoading = false;
            activeObject.isMinimized = false;
        }
    }
</script>

<Background onClick={handleClose} isConfirmationRequired={activeObject.isDirty} />
<aside
    class={cn([
        'absolute bottom-0 z-3 m-2 flex w-[calc(100dvw-8px*2)] max-w-100 flex-col rounded-lg bg-white transition-[height]',
        {
            'h-14 overflow-hidden': activeObject.isMinimized,
            'h-[calc(100dvh-8px*2)]': !activeObject.isMinimized,
        },
    ])}
    transition:fly={{x: -100, duration: 200, easing: cubicInOut}}
>
    <section class="flex items-center gap-1 border-b p-3">
        <span
            class={cn('mr-2 flex-1 overflow-hidden text-nowrap text-ellipsis transition-colors', {
                'text-black': activeObject.isMinimized,
                'text-transparent': !activeObject.isMinimized,
            })}
        >
            {initialValues.name ?? ''}
        </span>
        <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-lg hover:bg-gray-100"
            onclick={handleMinimizeClick}
        >
            <i
                class={`fa-solid ${activeObject.isMinimized ? 'fa-chevron-up' : 'fa-chevron-down'}`}
            ></i>
        </Button>
        <CloseButton onClick={handleClose} isConfirmationRequired={activeObject.isDirty} />
    </section>
    {#key key}
        {#if isLoading}
            <!-- TODO: do a proper loader later -->
            <div class="flex flex-1 items-center justify-center">Loading...</div>
        {:else if canEditAll && isEditing}
            <Form {initialValues} />
        {:else if canEditPersonal && isEditing}
            <LightForm {initialValues} />
        {:else}
            <ViewMode {initialValues} permissions={{canEditAll, canEditPersonal}} />
        {/if}
    {/key}
</aside>
