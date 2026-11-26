<script lang="ts">
    import type {Id} from '$convex/_generated/dataModel';
    import CategoryBadge from '$lib/components/categoryBadge.svelte';
    import Spinner from '$lib/components/spinner.svelte';
    import {bindTaxonomyActions} from '$lib/components/taxonomies/taxonomyActions';
    import {describeTaxonomyError} from '$lib/components/taxonomies/taxonomyErrors';
    import TaxonomyRemovalPanel from '$lib/components/taxonomies/taxonomyRemovalPanel.svelte';
    import {Button} from '$lib/components/ui/button';
    import {Input} from '$lib/components/ui/input';
    import type {TaxonomyEntry, TaxonomyRowMode, TaxonomyType} from '$lib/interfaces/taxonomy';
    import {cn} from '$lib/utils.js';
    import {pluralizeRussian} from '$lib/utils/plural';
    import CheckIcon from '@lucide/svelte/icons/check';
    import PencilIcon from '@lucide/svelte/icons/pencil';
    import Trash2Icon from '@lucide/svelte/icons/trash-2';
    import XIcon from '@lucide/svelte/icons/x';
    import {useConvexClient} from 'convex-svelte';
    import {toast} from 'svelte-sonner';

    interface Props {
        entry: TaxonomyEntry;
        type: TaxonomyType;
        siblings: TaxonomyEntry[];
        mode: TaxonomyRowMode;
        draftName?: string;
        onModeChange(mode: TaxonomyRowMode): void;
    }

    let {entry, type, siblings, mode, draftName = $bindable(''), onModeChange}: Props = $props();

    const actionsByType = bindTaxonomyActions(useConvexClient());

    let hasRequestedRemoval = $state(false);
    const isRemoving = $derived(hasRequestedRemoval || Boolean(entry.isDeleting));
    let isBusy = $state(false);
    let nameInput = $state<HTMLInputElement | null>(null);

    const actions = $derived(actionsByType[type]);
    const replacements = $derived(
        siblings
            .filter(item => item.id !== entry.id && !item.isDeleting)
            .map(item => ({id: item.id, name: item.name})),
    );
    const usageLabel = $derived(
        entry.usageCount === 0
            ? 'не используется'
            : `${entry.usageCount} ${pluralizeRussian(entry.usageCount, ['объект', 'объекта', 'объектов'])}`,
    );

    $effect(() => {
        nameInput?.select();
    });

    async function applyRename() {
        if (draftName.trim() === entry.name) {
            onModeChange('view');
            return;
        }

        isBusy = true;
        try {
            await actions.rename(entry.id, draftName);
            onModeChange('view');
        } catch (error) {
            toast.error(describeTaxonomyError(error));
        } finally {
            isBusy = false;
        }
    }

    // Stopping Escape here keeps the dialog from treating it as a request to
    // leave a changed draft, which it would confirm first.
    function handleNameKeydown(event: KeyboardEvent) {
        if (event.key === 'Enter') {
            applyRename();
        } else if (event.key === 'Escape') {
            event.stopPropagation();
            onModeChange('view');
        }
    }

    async function applyRemoval(replacementId: string | null) {
        isBusy = true;
        try {
            await actions.remove(entry.id, replacementId);
            // Shared taxonomies are rewritten in scheduled batches, so the row
            // stays until the last batch deletes it and unmounts it.
            hasRequestedRemoval = true;
            onModeChange('view');
        } catch (error) {
            toast.error(describeTaxonomyError(error));
        } finally {
            isBusy = false;
        }
    }
</script>

<div class={cn('rounded-lg', mode === 'view' ? 'hover:bg-accent/50' : 'bg-muted/50')}>
    <div
        class={cn(
            'flex min-h-11 gap-2 py-1 pr-1 pl-3 pointer-coarse:py-0',
            mode === 'rename' ? 'items-center' : 'items-start',
        )}
    >
        {#if mode === 'rename'}
            <Input
                bind:value={draftName}
                bind:ref={nameInput}
                disabled={isBusy}
                onkeydown={handleNameKeydown}
                aria-label="Новое название"
                class="-ml-2 h-9"
            />
            <Button
                size="icon"
                variant="ghost"
                class="pointer-coarse:size-11"
                loading={isBusy}
                onclick={applyRename}
                aria-label="Сохранить"
            >
                <CheckIcon />
            </Button>
            <Button
                size="icon"
                variant="ghost"
                class="text-muted-foreground pointer-coarse:size-11"
                disabled={isBusy}
                onclick={() => onModeChange('view')}
                aria-label="Отменить"
            >
                <XIcon />
            </Button>
        {:else}
            {#if type === 'category'}
                <CategoryBadge
                    name={entry.name}
                    categoryId={entry.id as Id<'categories'>}
                    showName={false}
                    class="mt-2 pointer-coarse:mt-3"
                />
            {/if}
            <div
                class="min-w-0 flex-1 pt-1.5 pb-1 sm:flex sm:items-baseline sm:gap-3 pointer-coarse:pt-2.5"
            >
                <span
                    class="block text-sm wrap-break-word sm:flex-1"
                    class:text-muted-foreground={isRemoving}
                >
                    {entry.name}
                </span>
                <span
                    class="text-muted-foreground block text-[13px]/4.5 sm:w-28 sm:shrink-0 sm:text-right"
                >
                    {usageLabel}
                </span>
            </div>
            <div
                class="flex min-w-19 shrink-0 items-center justify-end gap-1 pointer-coarse:min-w-23"
            >
                {#if isRemoving}
                    <span
                        class="text-muted-foreground flex h-9 shrink-0 items-center gap-1.5 pr-2 text-xs"
                    >
                        <Spinner class="size-3.5" />
                        Удаляется…
                    </span>
                {:else}
                    <Button
                        size="icon"
                        variant="ghost"
                        class="text-muted-foreground pointer-coarse:size-11"
                        onclick={() => onModeChange('rename')}
                        aria-label="Переименовать"
                    >
                        <PencilIcon />
                    </Button>
                    <Button
                        size="icon"
                        variant="ghost"
                        class={cn(
                            'pointer-coarse:size-11',
                            mode === 'remove'
                                ? 'text-destructive hover:text-destructive'
                                : 'text-muted-foreground hover:text-destructive',
                        )}
                        onclick={() => onModeChange(mode === 'remove' ? 'view' : 'remove')}
                        aria-label="Удалить"
                        aria-expanded={mode === 'remove'}
                    >
                        <Trash2Icon />
                    </Button>
                {/if}
            </div>
        {/if}
    </div>

    {#if mode === 'remove' && !isRemoving}
        <TaxonomyRemovalPanel
            {entry}
            {type}
            {replacements}
            {isBusy}
            onConfirm={applyRemoval}
            onCancel={() => onModeChange('view')}
        />
    {/if}
</div>
