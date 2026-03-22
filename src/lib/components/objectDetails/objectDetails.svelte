<script lang="ts">
    import {fly, fade} from 'svelte/transition';
    import {cubicInOut} from 'svelte/easing';
    import type {LooseObject, Object} from '$lib/interfaces/object';
    import ObjectDetailsLive from '$lib/components/objectDetails/objectDetailsLive.svelte';
    import Form from '$lib/components/objectDetails/editMode/form.svelte';
    import {activeMarker} from '$lib/stores/map';
    import {Button} from '$lib/components/ui/button';
    import {Badge} from '$lib/components/ui/badge';
    import CloseButton from './closeButton.svelte';
    import Background from './background.svelte';
    import {mapState} from '$lib/state/map.svelte';
    import {cn} from '$lib/utils.ts';
    import {activeObject, resetActiveObject} from '$lib/state/activeObject.svelte.ts';
    import {
        setCreateDraftInitialValues,
        setCreateDraftPosition,
    } from '$lib/state/createDraft.svelte.ts';
    import type {Permissions} from '$lib/interfaces/permissions';
    import {goto} from '$app/navigation';
    import {useClerkContext} from 'svelte-clerk';
    import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

    interface Props {
        key: string;
        initialValues?: Partial<LooseObject>;
        isEditing?: boolean;
        isLoading?: boolean;
        disableIntroAnimation?: boolean;
        permissions?: Permissions;
        /** When set, close triggers this instead of navigating; caller handles transition then navigation */
        onCloseRequest?: () => void;
    }

    const ctx = useClerkContext();

    let {
        key,
        initialValues = $bindable(),
        isEditing = false,
        isLoading = false,
        disableIntroAnimation = false,
        permissions = {canEditAll: true, canEditPersonal: true},
        onCloseRequest,
    }: Props = $props();

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

    function handleMinimizeClick() {
        activeObject.isMinimized = !activeObject.isMinimized;
    }

    function handleClose() {
        if (!initialValues && !isLoading) {
            return;
        }

        if (initialValues?.id === null) {
            setCreateDraftInitialValues(null);
            setCreateDraftPosition(null);
        }

        activeMarker.deactivate();
        activeMarker.set(null);
        resetActiveObject();
        if (mapState.map) {
            mapState.map.getStreetView().setVisible(false);
        }

        if (onCloseRequest) {
            onCloseRequest();
        } else if (ctx.auth.userId) {
            goto('/');
        }
    }
</script>

<Background onClick={handleClose} isConfirmationRequired={activeObject.isDirty} />
<aside
    class={cn([
        'bg-background absolute bottom-0 z-3 m-2 flex w-[calc(100dvw-8px*2)] max-w-100 flex-col rounded-lg transition-[height]',
        {
            'h-14 overflow-hidden': activeObject.isMinimized,
            'h-[calc(100dvh-8px*2)]': !activeObject.isMinimized,
        },
    ])}
    in:flyTransition
    out:fly={{x: -100, duration: 200, easing: cubicInOut}}
>
    <section class="flex items-center gap-1 border-b p-3">
        <div class="mr-2 flex min-w-0 flex-1 items-center gap-2">
            <div class="flex items-baseline gap-2">
                {#if initialValues?.internalId}
                    <Badge variant="outline" class="shrink-0 font-mono text-xs tracking-wider">
                        {initialValues.internalId}
                    </Badge>
                {/if}
                {#if activeObject.isMinimized}
                    <span
                        class="text-foreground overflow-hidden text-nowrap text-ellipsis transition-colors"
                    >
                        {initialValues?.name ?? 'Новый маркер'}
                    </span>
                {/if}
            </div>
        </div>
        <Button variant="ghost" size="icon" class="h-8 w-8" onclick={handleMinimizeClick}>
            {#if activeObject.isMinimized}
                <ChevronUpIcon class="stroke-3" />
            {:else}
                <ChevronDownIcon class="stroke-3" />
            {/if}
        </Button>
        <CloseButton onClick={handleClose} isConfirmationRequired={activeObject.isDirty} />
    </section>
    {#key key}
        <div class="relative flex-1 overflow-hidden">
            {#if initialValues}
                <div class="absolute inset-0" in:fadeTransition out:fade={{duration: 150}}>
                    {#if initialValues.id}
                        <ObjectDetailsLive
                            initialValues={initialValues as Object}
                            {isEditing}
                            {permissions}
                        />
                    {:else}
                        <Form {initialValues} />
                    {/if}
                </div>
            {/if}
        </div>
    {/key}
</aside>
