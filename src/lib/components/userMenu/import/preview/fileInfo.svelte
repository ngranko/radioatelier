<script lang="ts">
    import {toast} from 'svelte-sonner';
    import {Label} from '$lib/components/ui/label';
    import {Button} from '$lib/components/ui/button';
    import {Checkbox} from '$lib/components/ui/checkbox';
    import {Root as SelectRoot, Trigger, Content, Item} from '$lib/components/ui/select';
    import {importState, resetImportState} from '$lib/state/import.svelte.ts';
    import {parseCsv} from '$lib/services/import/csv';
    import TrashIcon from '@lucide/svelte/icons/trash-2';
    import FileSpreadsheetIcon from '@lucide/svelte/icons/file-spreadsheet';

    function getSeparator() {
        return importState.separator;
    }

    async function handleSeparatorChange(separator: string) {
        try {
            if (!importState.rawCsvText) {
                return;
            }
            const promise = Promise.resolve().then(() =>
                parseCsv(importState.rawCsvText, separator),
            );
            toast.promise(promise, {
                loading: 'Обновляю превью...',
                error: 'Не удалось обновить превью',
                success: 'Превью обновлено',
            });
            const result = await promise;
            importState.separator = separator;
            importState.parsedRows = result;
            importState.preview = result.slice(0, 2);
        } catch (error) {
            console.error(error);
        }
    }

    function getSeparatorLabel() {
        if (importState.separator === '\t') {
            return 'Tab';
        }

        return importState.separator;
    }

    function getHasHeader() {
        return importState.hasHeader;
    }

    function setHasHeader(value: boolean) {
        importState.hasHeader = value;
    }

    function handleRemoveFile() {
        if (!document.startViewTransition) {
            resetImportState();
            return;
        }

        document.startViewTransition(() => resetImportState());
    }
</script>

<div class="bg-muted/50 space-y-2 rounded-lg border p-4">
    <div class="flex items-start justify-between">
        <div class="flex items-center gap-3">
            <div class="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-md">
                <FileSpreadsheetIcon class="text-primary size-6 stroke-2" />
            </div>
            <div>
                <p class="font-bold">{importState.name}</p>
                <p class="text-muted-foreground text-sm">
                    {(importState.size / 1024).toFixed(1)} KB
                </p>
            </div>
        </div>
        <Button
            variant="outline"
            size="icon"
            class="text-destructive hover:text-destructive hover:bg-destructive/10"
            onclick={handleRemoveFile}
        >
            <TrashIcon />
        </Button>
    </div>
    <div class="flex flex-col gap-2 pl-13">
        <Label class="text-sm whitespace-nowrap">
            Разделитель
            <!-- prettier-ignore -->
            <SelectRoot type="single" bind:value={getSeparator, handleSeparatorChange}>
                <Trigger id="separator" class="w-20">
                    {getSeparatorLabel()}
                </Trigger>
                <Content>
                    <Item value=";">;</Item>
                    <Item value="\t">Tab</Item>
                    <Item value="|">|</Item>
                </Content>
            </SelectRoot>
        </Label>

        <Label class="flex cursor-pointer items-center gap-2 text-sm">
            <Checkbox
                checked={getHasHeader()}
                onCheckedChange={value => setHasHeader(value === true)}
            />
            Первая строка - заголовки
        </Label>
    </div>
</div>
