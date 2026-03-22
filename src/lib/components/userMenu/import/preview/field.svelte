<script lang="ts">
    import Badge from '$lib/components/ui/badge/badge.svelte';
    import {Root as SelectRoot, Trigger, Content, Item} from '$lib/components/ui/select';
    import {FormField, FormControl} from '$lib/components/ui/form';
    import {type SuperForm} from 'sveltekit-superforms';
    import {cn} from '$lib/utils.ts';
    import {importState} from '$lib/state/import.svelte.ts';
    import XMarkIcon from '@lucide/svelte/icons/x';

    interface Props {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        form: SuperForm<any>;
        field: Field;
    }

    interface Field {
        name: string;
        label: string;
        required: boolean;
        validation: string;
    }

    let {form, field}: Props = $props();

    let {form: formData, errors} = form;

    const optionLabels = $derived.by(() => {
        const firstRow = importState.preview[0] ?? [];
        return firstRow.map((item, index) => {
            if (importState.hasHeader) {
                const normalized = item.trim();
                return normalized || `Колонка ${index + 1}`;
            }
            return `Колонка ${index + 1}`;
        });
    });
</script>

<div
    class={cn([
        'space-y-3 rounded-lg border p-4 transition-colors',
        {
            'bg-card hover:bg-accent/50': !$errors[field.name],
            'border-destructive bg-destructive/2 hover:bg-destructive/4': $errors[field.name],
        },
    ])}
>
    <div class="grid grid-cols-2 gap-4">
        <div class="flex items-center gap-2">
            <span class="font-medium">{field.label}</span>
            {#if field.required}
                <Badge variant="secondary" class="text-xs">Обязательное</Badge>
            {/if}
        </div>

        <FormField
            {form}
            name={field.name}
            class="col-start-2 col-end-2 row-start-1 row-end-1 space-y-0"
        >
            <FormControl>
                {#snippet children({props})}
                    <SelectRoot type="single" {...props} bind:value={$formData[field.name]}>
                        <Trigger>
                            {optionLabels[$formData[field.name]] ?? 'Не выбрано'}
                        </Trigger>
                        <Content>
                            <Item value="">
                                <span class="text-muted-foreground flex items-center gap-2">
                                    <XMarkIcon class="size-3.5" />
                                    Не выбрано
                                </span>
                            </Item>
                            {#each optionLabels as item, key (`option-${key}`)}
                                <Item value={String(key)}>
                                    {item}
                                </Item>
                            {/each}
                        </Content>
                    </SelectRoot>
                {/snippet}
            </FormControl>
        </FormField>

        {#if field.validation}
            <div class="bg-muted/50 col-span-full row-start-2 row-end-2 rounded-md border p-2">
                <p
                    class={cn([
                        'text-muted-foreground text-xs transition-colors',
                        {'text-destructive': $errors[field.name]},
                    ])}
                >
                    {field.validation}
                </p>
            </div>
        {/if}
    </div>
</div>
