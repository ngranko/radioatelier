<script lang="ts">
    import {api} from '$convex/_generated/api';
    import {describeTaxonomyError} from '$lib/components/admin/taxonomyErrors';
    import TaxonomyRemovalPanel from '$lib/components/admin/taxonomyRemovalPanel.svelte';
    import {Button} from '$lib/components/ui/button';
    import {Input} from '$lib/components/ui/input';
    import type {TaxonomyEntry, TaxonomyType} from '$lib/interfaces/taxonomy';
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
    }

    let {entry, type, siblings}: Props = $props();

    const client = useConvexClient();

    let mode = $state<'view' | 'rename' | 'remove'>('view');
    let draftName = $state('');
    let isBusy = $state(false);
    let nameInput = $state<HTMLInputElement | null>(null);

    const replacements = $derived(
        siblings.filter(item => item.id !== entry.id).map(item => ({id: item.id, name: item.name})),
    );
    const usageLabel = $derived(
        `${entry.usageCount} ${pluralizeRussian(entry.usageCount, ['объект', 'объекта', 'объектов'])}`,
    );

    function startRename() {
        draftName = entry.name;
        mode = 'rename';
        tick().then(() => nameInput?.select());
    }

    async function applyRename() {
        if (draftName.trim() === entry.name) {
            mode = 'view';
            return;
        }

        isBusy = true;
        try {
            await client.mutation(api.taxonomies.rename, {type, id: entry.id, name: draftName});
            mode = 'view';
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
            toast.success(`«${entry.name}» удалено`);
            mode = 'view';
        } catch (error) {
            toast.error(describeTaxonomyError(error));
        } finally {
            isBusy = false;
        }
    }
</script>

<div class="border-border/50 space-y-2.5 rounded-lg border p-3">
    <div class="flex items-center gap-3">
        {#if mode === 'rename'}
            <Input
                bind:value={draftName}
                bind:ref={nameInput}
                disabled={isBusy}
                onkeydown={event => event.key === 'Enter' && applyRename()}
                class="h-9"
            />
            <Button size="icon" variant="ghost" loading={isBusy} onclick={applyRename}>
                <CheckIcon class="size-4" />
            </Button>
            <Button size="icon" variant="ghost" disabled={isBusy} onclick={() => (mode = 'view')}>
                <XIcon class="size-4" />
            </Button>
        {:else}
            <p class="min-w-0 flex-1 truncate text-sm font-medium">{entry.name}</p>
            <span class="text-muted-foreground shrink-0 text-xs">{usageLabel}</span>
            <Button size="icon" variant="ghost" onclick={startRename} aria-label="Переименовать">
                <PencilIcon class="size-4" />
            </Button>
            <Button
                size="icon"
                variant="ghost"
                class="text-destructive hover:text-destructive"
                onclick={() => (mode = mode === 'remove' ? 'view' : 'remove')}
                aria-label="Удалить"
            >
                <Trash2Icon class="size-4" />
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
            onCancel={() => (mode = 'view')}
        />
    {/if}
</div>
