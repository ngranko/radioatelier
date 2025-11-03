<script lang="ts">
    import {type ImportMappings, ImportStepProgress} from '$lib/interfaces/import';
    import {DialogClose, DialogFooter} from '$lib/components/ui/dialog/index.js';
    import FileInfo from '$lib/components/userMenu/import/preview/fileInfo.svelte';
    import RowPreview from '$lib/components/userMenu/import/preview/rowPreview.svelte';
    import {Button} from '$lib/components/ui/button';
    import {defaults, superForm} from 'sveltekit-superforms';
    import {zod4, zod4Client} from 'sveltekit-superforms/adapters';
    import {z} from 'zod';
    import Field from '$lib/components/userMenu/import/preview/field.svelte';
    import MissingFieldsNotification from '$lib/components/userMenu/import/preview/missingFieldsNotification.svelte';
    import {fieldList} from '$lib/components/userMenu/import/preview/preview.ts';
    import {importState} from '$lib/state/import.svelte.ts';

    const schema = z.object({
        coordinates: z
            .number()
            .nonnegative()
            .nullable()
            .default(null)
            .refine((value): value is number => value !== null, 'Это обязательное поле'),
        name: z
            .number()
            .nonnegative()
            .nullable()
            .default(null)
            .refine((value): value is number => value !== null, 'Это обязательное поле'),
        isVisited: z.number().nonnegative().nullable().default(null),
        isPublic: z.number().nonnegative().nullable().default(null),
        isRemoved: z.number().nonnegative().nullable().default(null),
        category: z
            .number()
            .nonnegative()
            .nullable()
            .default(null)
            .refine((value): value is number => value !== null, 'Это обязательное поле'),
        tags: z.number().nonnegative().nullable().default(null),
        privateTags: z.number().nonnegative().nullable().default(null),
        address: z.number().nonnegative().nullable().default(null),
        city: z.number().nonnegative().nullable().default(null),
        country: z.number().nonnegative().nullable().default(null),
        installedPeriod: z.number().nonnegative().nullable().default(null),
        removalPeriod: z.number().nonnegative().nullable().default(null),
        description: z.number().nonnegative().nullable().default(null),
        source: z.number().nonnegative().nullable().default(null),
        image: z.number().nonnegative().nullable().default(null),
    });

    type ImportFormInputs = z.infer<typeof schema>;

    const form = superForm<ImportFormInputs>(defaults(zod4(schema)), {
        SPA: true,
        validators: zod4Client(schema),
        onUpdate({form}) {
            if (form.valid) {
                handleImport(form.data);
            }
        },
    });

    const {form: formData, enhance, submitting} = form;

    const missingFieldsCount = $derived(
        fieldList
            .filter(item => item.required)
            .filter(item => !($formData as Record<string, any>)[item.name]).length,
    );

    const selectedFieldsCount = $derived(Object.values($formData).filter(v => v !== null).length);

    function handleImport(values: ImportMappings) {
        importState.provider.start(importState.id, importState.separator, values);
        importState.step = ImportStepProgress;
    }
</script>

<form class="flex min-h-0 flex-1 flex-col" use:enhance>
    <div class="flex-1 space-y-4 overflow-y-auto py-4">
        <FileInfo />
        <RowPreview />

        {#if missingFieldsCount > 0}
            <MissingFieldsNotification count={missingFieldsCount} />
        {/if}

        <div class="space-y-3">
            <div class="flex items-center justify-between">
                <h3 class="text-base font-semibold">Соответствие полей</h3>
                <span class="text-muted-foreground text-sm">
                    {selectedFieldsCount} из {fieldList.length} полей выбрано
                </span>
            </div>
            <div class="grid gap-3">
                {#each fieldList as field}
                    <Field {form} {field} />
                {/each}
            </div>
        </div>
    </div>
    <DialogFooter class="border-t bg-white pt-2">
        <DialogClose>
            <Button variant="ghost">Отменить</Button>
        </DialogClose>
        <Button type="submit" disabled={$submitting}>Импортировать</Button>
    </DialogFooter>
</form>
