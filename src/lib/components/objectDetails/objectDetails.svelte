<script lang="ts">
    import {fade} from 'svelte/transition';
    import type {LooseObject, Object} from '$lib/interfaces/object';
    import ViewModeSkeleton from '$lib/components/objectDetails/viewMode/viewModeSkeleton.svelte';
    import {clearActiveMarker, deactivateMarker} from '$lib/state/activeMarker.svelte.ts';
    import {Button} from '$lib/components/ui/button';
    import {badgeVariants} from '$lib/components/ui/badge';
    import {toast} from 'svelte-sonner';
    import CloseButton from './closeButton.svelte';
    import Background from './background.svelte';
    import {mapState} from '$lib/state/map.svelte';
    import {cn} from '$lib/utils.ts';
    import {
        objectDetailsOverlay,
        closeDetailsOverlay,
    } from '$lib/state/objectDetailsOverlay.svelte';
    import type {Permissions} from '$lib/interfaces/permissions';
    import {goto} from '$app/navigation';
    import {useClerkContext} from 'svelte-clerk';
    import ChevronUpIcon from '@lucide/svelte/icons/chevron-up';
    import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';
    import {getActiveSearchUrl} from '$lib/state/search.svelte';
    import {setCreateDraftPosition} from '$lib/state/createDraft.svelte';
    import EditMode from '$lib/components/objectDetails/editMode/editMode.svelte';
    import ViewMode from './viewMode/viewMode.svelte';

    interface Props {
        initialValues?: Partial<LooseObject>;
        permissions?: Permissions;
    }

    const ctx = useClerkContext();

    let {
        initialValues = $bindable(),
        permissions = {canEditAll: true, canEditPersonal: true},
    }: Props = $props();

    function handleMinimizeClick() {
        objectDetailsOverlay.isMinimized = !objectDetailsOverlay.isMinimized;
    }

    async function copyInternalId(text: string) {
        try {
            await navigator.clipboard.writeText(text);
            toast.success('ID скопирован');
        } catch {
            toast.error('Не удалось скопировать');
        }
    }

    function handleClose() {
        setCreateDraftPosition(null);
        deactivateMarker();
        clearActiveMarker();
        closeDetailsOverlay();
        if (mapState.isReady) {
            mapState.provider.closeStreetView();
        }

        if (ctx.auth.userId) {
            closeDetailsOverlay();
            goto(getActiveSearchUrl());
        } else {
            // this is for a case when a user is not logged in and wants to close the details overlay
            // otherwise I'll lose the values and will use the server fallback
            // TODO: in the future it's best to come up with a better solution
            const object = objectDetailsOverlay.details;
            closeDetailsOverlay();
            objectDetailsOverlay.details = object;
        }
    }
</script>

<Background onClick={handleClose} isConfirmationRequired={objectDetailsOverlay.isDirty} />
<aside
    class={cn([
        'bg-background absolute bottom-0 z-3 m-2 flex w-[calc(100dvw-8px*2)] max-w-100 flex-col rounded-lg transition-[height]',
        {
            'h-14 overflow-hidden': objectDetailsOverlay.isMinimized,
            'h-[calc(100dvh-8px*2)]': !objectDetailsOverlay.isMinimized,
        },
    ])}
>
    <section class="flex items-center gap-1 border-b p-3">
        <div class="mr-2 flex min-w-0 flex-1 items-center gap-2">
            <div class="flex min-w-0 flex-1 items-baseline gap-2">
                {#if initialValues?.internalId}
                    <button
                        type="button"
                        class={cn(
                            badgeVariants({variant: 'outline'}),
                            'hover:bg-accent hover:text-accent-foreground shrink-0 font-mono text-xs tracking-wider',
                        )}
                        title="Нажмите, чтобы скопировать"
                        onclick={() => copyInternalId(initialValues.internalId ?? '')}
                    >
                        {initialValues.internalId}
                    </button>
                {/if}
                {#if objectDetailsOverlay.isMinimized}
                    <span
                        class="text-foreground block min-w-0 flex-1 overflow-hidden text-nowrap text-ellipsis transition-colors"
                    >
                        {initialValues?.name ?? 'Новый маркер'}
                    </span>
                {/if}
            </div>
        </div>
        <Button variant="ghost" size="icon" class="h-8 w-8 shrink-0" onclick={handleMinimizeClick}>
            {#if objectDetailsOverlay.isMinimized}
                <ChevronUpIcon class="stroke-3" />
            {:else}
                <ChevronDownIcon class="stroke-3" />
            {/if}
        </Button>
        <CloseButton onClick={handleClose} isConfirmationRequired={objectDetailsOverlay.isDirty} />
    </section>
    <div class="relative flex-1 overflow-hidden">
        <div class="absolute inset-0" in:fade={{duration: 150}} out:fade={{duration: 150}}>
            {#if objectDetailsOverlay.isLoading}
                <ViewModeSkeleton />
            {:else if objectDetailsOverlay.isEditing}
                <EditMode initialValues={initialValues as Object} {permissions} />
            {:else}
                <ViewMode initialValues={initialValues as Object} {permissions} />
            {/if}
        </div>
    </div>
</aside>
