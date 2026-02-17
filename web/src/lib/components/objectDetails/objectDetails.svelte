<script lang="ts">
    import {fly, fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import {untrack} from 'svelte';
    import type {LooseObject, Object} from '$lib/interfaces/object';
    import ObjectDetailsLive from '$lib/components/objectDetails/objectDetailsLive.svelte';
    import Form from '$lib/components/objectDetails/editMode/form.svelte';
    import LightForm from '$lib/components/objectDetails/editMode/lightForm.svelte';
    import ViewMode from '$lib/components/objectDetails/viewMode/viewMode.svelte';
    import ViewModeSkeleton from '$lib/components/objectDetails/viewMode/viewModeSkeleton.svelte';
    import FormSkeleton from '$lib/components/objectDetails/editMode/formSkeleton.svelte';
    import {activeMarker} from '$lib/stores/map';
    import {Button} from '$lib/components/ui/button';
    import CloseButton from './closeButton.svelte';
    import Background from './background.svelte';
    import {mapState} from '$lib/state/map.svelte';
    import {cn} from '$lib/utils.ts';
    import {activeObject, resetActiveObject} from '$lib/state/activeObject.svelte.ts';
    import type {Permissions} from '$lib/interfaces/permissions';
    import {goto} from '$app/navigation';
    import {useClerkContext} from 'svelte-clerk';

    interface Props {
        key: string;
        initialValues?: Partial<LooseObject>;
        isEditing?: boolean;
        isLoading?: boolean;
        disableIntroAnimation?: boolean;
        permissions?: Permissions;
    }

    const ctx = useClerkContext();

    let {
        key,
        initialValues = $bindable(),
        isEditing = false,
        isLoading = false,
        disableIntroAnimation = false,
        permissions = {canEditAll: true, canEditPersonal: true},
    }: Props = $props();

    let showSkeleton = $state(false);
    let skeletonTimeout: ReturnType<typeof setTimeout> | null = null;

    $effect(() => {
        if (isLoading) {
            skeletonTimeout = setTimeout(() => {
                showSkeleton = true;
            }, 150);
        } else {
            if (skeletonTimeout) {
                clearTimeout(skeletonTimeout);
                skeletonTimeout = null;
            }
            untrack(() => {
                showSkeleton = false;
            });
        }

        return () => {
            if (skeletonTimeout) {
                clearTimeout(skeletonTimeout);
            }
        };
    });

    // Custom transition that skips animation on SSR hydration
    function flyTransition(node: HTMLElement) {
        if (disableIntroAnimation) {
            return {duration: 0, css: () => ''};
        }
        return fly(node, {x: -100, duration: 200, easing: cubicInOut});
    }

    // Custom fade transition that skips animation on SSR hydration
    function fadeTransition(node: HTMLElement) {
        if (disableIntroAnimation) {
            return {duration: 0, css: () => ''};
        }
        return fade(node, {duration: 150});
    }

    const canEditAll = $derived.by(() => {
        if (!initialValues || initialValues.id === null) {
            return permissions.canEditAll;
        }

        // TODO: redo this
        const isOwner =
            initialValues.isOwner ?? (activeObject.object as Object | null)?.isOwner ?? false;
        return permissions.canEditAll && isOwner;
    });

    const canEditPersonal = $derived.by(() => {
        if (!initialValues || initialValues.id === null) {
            return permissions.canEditPersonal;
        }

        // TODO: redo this
        const isOwner =
            initialValues.isOwner ?? (activeObject.object as Object | null)?.isOwner ?? false;
        return permissions.canEditPersonal && !isOwner;
    });

    function handleMinimizeClick() {
        activeObject.isMinimized = !activeObject.isMinimized;
    }

    function handleClose() {
        if (!activeObject.object && !isLoading) {
            return;
        }

        activeMarker.deactivate();
        activeMarker.set(null);
        resetActiveObject();
        if (mapState.map) {
            mapState.map.getStreetView().setVisible(false);
        }

        if (ctx.auth.userId) {
            setTimeout(() => goto('/'), 200);
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
    in:flyTransition
    out:fly={{x: -100, duration: 200, easing: cubicInOut}}
>
    <section class="flex items-center gap-1 border-b p-3">
        <span
            class={cn('mr-2 flex-1 overflow-hidden text-nowrap text-ellipsis transition-colors', {
                'text-black': activeObject.isMinimized,
                'text-transparent': !activeObject.isMinimized,
            })}
        >
            {initialValues?.name ?? ''}
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
        <div class="relative flex-1 overflow-hidden">
            {#if isLoading && showSkeleton}
                <div class="absolute inset-0" in:fadeTransition out:fade={{duration: 150}}>
                    {#if isEditing}
                        <FormSkeleton />
                    {:else}
                        <ViewModeSkeleton />
                    {/if}
                </div>
                <!-- TODO: don't like this, redo later -->
            {:else if !isLoading && initialValues}
                <div class="absolute inset-0" in:fadeTransition out:fade={{duration: 150}}>
                    {#if initialValues.id}
                        <ObjectDetailsLive
                            initialValues={initialValues as Object}
                            {isEditing}
                            {permissions}
                        />
                    {:else if canEditAll && isEditing}
                        <Form {initialValues} />
                    {:else if canEditPersonal && isEditing}
                        <LightForm {initialValues} />
                    {:else}
                        <ViewMode {initialValues} permissions={{canEditAll, canEditPersonal}} />
                    {/if}
                </div>
            {/if}
        </div>
    {/key}
</aside>
