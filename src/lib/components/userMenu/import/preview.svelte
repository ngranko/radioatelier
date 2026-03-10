<script lang="ts">
    import {
        type ImportMappings,
        type ImportMappingsForJob,
        ImportStepError,
        ImportStepProgress,
    } from '$lib/interfaces/import';
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
    import {importState, initializeImportProvider} from '$lib/state/import.svelte.ts';
    import {normalizeRows} from '$lib/services/import/normalize';
    import {useConvexClient} from 'convex-svelte';

    const client = useConvexClient();

    const optionalMapping = z.preprocess(value => {
        if (value === null || value === undefined || value === '') {
            return null;
        }
        if (typeof value === 'string') {
            const parsed = Number(value);
            return Number.isNaN(parsed) ? value : parsed;
        }
        return value;
    }, z.number().nonnegative().nullable().default(null));

    const requiredMapping = optionalMapping.refine(
        (value): value is number => value !== null,
        'Это обязательное поле',
    );

    const schema = z.object({
        coordinates: requiredMapping,
        name: requiredMapping,
        isVisited: optionalMapping,
        isPublic: optionalMapping,
        isRemoved: optionalMapping,
        category: requiredMapping,
        tags: optionalMapping,
        privateTags: optionalMapping,
        address: optionalMapping,
        city: optionalMapping,
        country: optionalMapping,
        installedPeriod: optionalMapping,
        removalPeriod: optionalMapping,
        description: optionalMapping,
        source: optionalMapping,
        image: optionalMapping,
    });

    type ImportFormInputs = z.infer<typeof schema>;

    const form = superForm<ImportFormInputs>(defaults(zod4(schema)), {
        SPA: true,
        validators: zod4Client(schema),
        async onUpdate({form}) {
            if (form.valid) {
                await handleImport(form.data);
            }
        },
    });

    const {form: formData, enhance, submitting} = form;

    function isMappedField(value: unknown): boolean {
        return value !== null && value !== undefined && value !== '';
    }

    const missingFieldsCount = $derived(
        fieldList
            .filter(item => item.required)
            .filter(item => !isMappedField(($formData as Record<string, unknown>)[item.name]))
            .length,
    );

    const selectedFieldsCount = $derived(
        Object.values($formData as Record<string, unknown>).filter(isMappedField).length,
    );

    async function handleImport(values: ImportMappings) {
        const provider = initializeImportProvider(client);
        const mappings = toJobMappings(values);
        if (!mappings) {
            importState.globalError = 'Проверьте обязательные поля';
            importState.step = ImportStepError;
            return;
        }
        const rows = normalizeRows(importState.parsedRows, mappings, importState.hasHeader);
        try {
            const jobId = await provider.start(rows, mappings);
            importState.importJobId = jobId;
            importState.totalRows = rows.length;
            importState.step = ImportStepProgress;
        } catch (error) {
            importState.globalError =
                error instanceof Error ? error.message : 'Не удалось начать импорт';
            importState.step = ImportStepError;
        }
    }

    function toJobMappings(values: ImportMappings): ImportMappingsForJob | null {
        if (values.coordinates === null || values.name === null || values.category === null) {
            return null;
        }
        return {
            ...values,
        } as ImportMappingsForJob;
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
                {#each fieldList as field (field.name)}
                    <Field {form} {field} />
                {/each}
            </div>
        </div>
    </div>
    <DialogFooter class="gap-4 border-t bg-white pt-2">
        <DialogClose>Отменить</DialogClose>
        <Button type="submit" disabled={$submitting}>Импортировать</Button>
    </DialogFooter>
</form>
