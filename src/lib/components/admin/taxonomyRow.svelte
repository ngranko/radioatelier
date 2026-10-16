<script lang="ts">
    import {api} from '$convex/_generated/api';
    import type {Id} from '$convex/_generated/dataModel';
    import {describeTaxonomyError} from '$lib/components/admin/taxonomyErrors';
    import TaxonomyRemovalPanel from '$lib/components/admin/taxonomyRemovalPanel.svelte';
    import CategoryBadge from '$lib/components/categoryBadge.svelte';
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
    import {tick} from 'svelte';
    import {toast} from 'svelte-sonner';

    interface Props {
        entry: TaxonomyEntry;
        type: TaxonomyType;
        siblings: TaxonomyEntry[];
        mode: TaxonomyRowMode;
        onModeChange(mode: TaxonomyRowMode): void;
    }

    let {entry, type, siblings, mode, onModeChange}: Props = $props();

    const removalNotices: Record<TaxonomyType, string> = {
        category: 'Категория удалена',
        tag: 'Тег удалён',
        privateTag: 'Тег удалён',
    };

    const client = useConvexClient();

    let draftName = $state('');
    let isBusy = $state(false);
    let nameInput = $state<HTMLInputElement | null>(null);

    const replacements = $derived(
        siblings.filter(item => item.id !== entry.id).map(item => ({id: item.id, name: item.name})),
    );
    const usageLabel = $derived(
        entry.usageCount === 0
            ? 'не используется'
            : `${entry.usageCount} ${pluralizeRussian(entry.usageCount, ['объект', 'объекта', 'объектов'])}`,
    );

    function startRename() {
        draftName = entry.name;
        onModeChange('rename');
        tick().then(() => nameInput?.select());
    }

    async function applyRename() {
        if (draftName.trim().toLowerCase() === entry.name) {
            onModeChange('view');
            return;
        }

        isBusy = true;
        try {
            await client.mutation(api.taxonomies.rename, {type, id: entry.id, name: draftName});
            onModeChange('view');
        } catch (error) {
            toast.error(describeTaxonomyError(error));
        } finally {
            isBusy = false;
        }
    }

    async function applyRemoval(replacementId: string | null) {
        isBusy = true;
        try {
            await client.mutation(api.taxonomies.remove, {type, id: entry.id, replacementId});
            toast.success(removalNotices[type]);
            onModeChange('view');
        } catch (error) {
            toast.error(describeTaxonomyError(error));
        } finally {
            isBusy = false;
        }
    }
</script>

<div class={cn('rounded-lg', mode === 'view' ? 'hover:bg-accent/50' : 'bg-muted/50')}>
    <div class="flex min-h-11 items-center gap-2 py-1 pr-1 pl-3">
        {#if mode === 'rename'}
            <Input
                bind:value={draftName}
                bind:ref={nameInput}
                disabled={isBusy}
                onkeydown={event => event.key === 'Enter' && applyRename()}
                aria-label="Новое название"
                class="-ml-2 h-9"
            />
            <Button
                size="icon"
                variant="ghost"
                loading={isBusy}
                onclick={applyRename}
                aria-label="Сохранить"
            >
                <CheckIcon />
            </Button>
            <Button
                size="icon"
                variant="ghost"
                class="text-muted-foreground"
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
                />
            {/if}
            <span class="min-w-0 flex-1 py-1 text-sm break-words">{entry.name}</span>
            <span class="text-muted-foreground shrink-0 text-xs">{usageLabel}</span>
            <Button
                size="icon"
                variant="ghost"
                class="text-muted-foreground"
                onclick={startRename}
                aria-label="Переименовать"
            >
                <PencilIcon />
            </Button>
            <Button
                size="icon"
                variant="ghost"
                class={mode === 'remove'
                    ? 'text-destructive hover:text-destructive'
                    : 'text-muted-foreground hover:text-destructive'}
                onclick={() => onModeChange(mode === 'remove' ? 'view' : 'remove')}
                aria-label="Удалить"
                aria-expanded={mode === 'remove'}
            >
                <Trash2Icon />
            </Button>
        {/if}
    </div>

    {#if mode === 'remove'}
        <TaxonomyRemovalPanel
            {entry}
            {replacements}
            isReplacementRequired={type === 'category' && entry.usageCount > 0}
            {isBusy}
            onConfirm={applyRemoval}
            onCancel={() => onModeChange('view')}
        />
    {/if}
</div>
