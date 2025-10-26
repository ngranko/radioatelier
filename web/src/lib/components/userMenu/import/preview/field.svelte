<script lang="ts">
    import Badge from '$lib/components/ui/badge/badge.svelte';
    import * as Select from '$lib/components/ui/select';
    import * as Form from '$lib/components/ui/form';
    import {type SuperForm} from 'sveltekit-superforms';
    import {cn} from '$lib/utils.ts';
    import {importState} from '$lib/state/import.svelte.ts';

    interface Props {
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

        <Form.Field
            {form}
            name="name"
            class="col-start-2 col-end-2 row-start-1 row-end-1 space-y-0"
        >
            <Form.Control>
                {#snippet children({props})}
                    <Select.Root type="single" {...props} bind:value={$formData[field.name]}>
                        <Select.Trigger>
                            {importState.preview[0][$formData[field.name]] ?? 'Не выбрано'}
                        </Select.Trigger>
                        <Select.Content>
                            <Select.Item value={null}>
                                <span class="text-muted-foreground flex items-center gap-2">
                                    <i class="fa-solid fa-xmark"></i>
                                    Не выбрано
                                </span>
                            </Select.Item>
                            {#each importState.preview[0] as item, key}
                                <Select.Item value={key}>
                                    {item}
                                </Select.Item>
                            {/each}
                        </Select.Content>
                    </Select.Root>
                {/snippet}
            </Form.Control>
        </Form.Field>

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
