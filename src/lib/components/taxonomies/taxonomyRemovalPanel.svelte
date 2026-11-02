<script lang="ts">
    import Combobox from '$lib/components/input/combobox.svelte';
    import {Button} from '$lib/components/ui/button';
    import type {Option} from '$lib/interfaces/option';
    import type {TaxonomyEntry, TaxonomyType} from '$lib/interfaces/taxonomy';

    interface Props {
        entry: TaxonomyEntry;
        type: TaxonomyType;
        replacements: Option[];
        isBusy: boolean;
        onConfirm(replacementId: string | null): void;
        onCancel(): void;
    }

    let {entry, type, replacements, isBusy, onConfirm, onCancel}: Props = $props();

    let replacementId = $state<string | undefined>();

    const isUsed = $derived(entry.usageCount > 0);
    const isReplacementRequired = $derived(type === 'category' && isUsed);

    const canConfirm = $derived(!isReplacementRequired || Boolean(replacementId));
</script>

<div class="space-y-3 px-3 pb-3">
    {#if isUsed}
        <p class="text-muted-foreground text-xs leading-snug">
            {isReplacementRequired
                ? 'Объекты не могут остаться без категории — выберите, куда их перенести.'
                : 'Без переноса тег просто снимется с объектов.'}
        </p>
        <Combobox
            options={replacements}
            bind:value={replacementId}
            placeholder="Перенести объекты в..."
            disabled={isBusy}
            wrapperClass="w-full"
        />
    {/if}

    <div class="flex justify-end gap-2">
        <Button variant="ghost" size="sm" onclick={onCancel} disabled={isBusy}>Отменить</Button>
        <Button
            size="sm"
            class="bg-destructive hover:bg-destructive/70"
            loading={isBusy}
            disabled={!canConfirm}
            onclick={() => onConfirm(replacementId ?? null)}
        >
            {replacementId ? 'Перенести и удалить' : 'Удалить'}
        </Button>
    </div>
</div>
