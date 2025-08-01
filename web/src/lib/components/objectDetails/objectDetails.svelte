<script lang="ts">
    import {fly} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import type {LooseObject} from '$lib/interfaces/object';
    import Form from '$lib/components/objectDetails/editMode/form.svelte';
    import ViewMode from '$lib/components/objectDetails/viewMode/viewMode.svelte';
    import {activeMarker, activeObjectInfo, map} from '$lib/stores/map';
    import CloseConfirmation from '$lib/components/objectDetails/closeConfirmation.svelte';
    import {clsx} from 'clsx';
    import {Button} from '$lib/components/ui/button';

    interface Props {
        key: string;
        initialValues: Partial<LooseObject>;
        isLoading?: boolean;
        isEditing?: boolean;
    }

    let {key, initialValues = $bindable(), isLoading = false, isEditing = false}: Props = $props();

    let isCloseConfirmationOpen = $state(false);

    function handleMinimizeClick() {
        activeObjectInfo.update(value => ({...value, isMinimized: !value.isMinimized}));
    }

    function handleCloseClick() {
        if ($activeObjectInfo.isDirty) {
            isCloseConfirmationOpen = true;
        } else {
            handleClose();
        }
    }

    function handleClose() {
        if (!$activeObjectInfo.object) {
            return;
        }

        activeMarker.deactivate();
        activeMarker.set(null);
        activeObjectInfo.reset();
        if ($map) {
            $map.getStreetView().setVisible(false);
        }
    }
</script>

<div class="fixed inset-0 z-2 bg-transparent" onclick={handleCloseClick}></div>
<aside
    class={clsx([
        'absolute bottom-0 z-3 m-2 flex w-[calc(100dvw-8px*2)] max-w-100 flex-col rounded-lg bg-white transition-[height]',
        {
            'h-14': $activeObjectInfo.isMinimized,
            'h-[calc(100dvh-8px*2)]': !$activeObjectInfo.isMinimized,
        },
    ])}
    transition:fly={{x: -100, duration: 200, easing: cubicInOut}}
>
    <section class="flex items-center gap-1 border-b p-3">
        <span
            class={clsx('mr-2 flex-1 overflow-hidden text-nowrap text-ellipsis transition-colors', {
                'text-black': $activeObjectInfo.isMinimized,
                'text-transparent': !$activeObjectInfo.isMinimized,
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
                class={`fa-solid ${$activeObjectInfo.isMinimized ? 'fa-chevron-up' : 'fa-chevron-down'}`}
            ></i>
        </Button>
        <Button
            variant="ghost"
            size="icon"
            class="h-8 w-8 text-lg hover:bg-gray-100"
            onclick={handleCloseClick}
        >
            <i class="fa-solid fa-xmark"></i>
        </Button>
    </section>
    {#key key}
        {#if isLoading}
            <!-- TODO: do a proper loader later -->
            <div class="flex flex-1 items-center justify-center">Loading...</div>
        {:else if isEditing}
            <Form {initialValues} />
        {:else}
            <ViewMode {initialValues} />
        {/if}
    {/key}
</aside>
<CloseConfirmation bind:isOpen={isCloseConfirmationOpen} onClick={handleClose} />
