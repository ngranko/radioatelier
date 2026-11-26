<script lang="ts">
    import {Button, buttonVariants} from '$lib/components/ui/button';
    import {DialogClose, Footer} from '$lib/components/ui/dialog';
    import {ImportStepPreview} from '$lib/interfaces/import.ts';
    import {parseCsv, readCsvFile} from '$lib/services/import/csv';
    import {importState} from '$lib/state/import.svelte.ts';
    import {cn} from '$lib/utils.js';
    import FileSpreadsheetIcon from '@lucide/svelte/icons/file-spreadsheet';
    import {toast} from 'svelte-sonner';

    let isDragging = $state(false);
    let fileInput = $state<HTMLInputElement | null>(null);

    function handleDragOver(e: DragEvent) {
        e.preventDefault();
        isDragging = true;
    }

    function handleDragLeave(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        isDragging = false;
        const file = e.dataTransfer?.files[0];
        if (file) {
            handleFile(file);
        }
    }

    function handleFileChange(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (!file) {
            console.error('no file selected');
            return;
        }

        handleFile(file);
    }

    async function handleFile(file: File) {
        try {
            const promise = readAndPreview(file);
            toast.promise(promise, {
                loading: 'Обрабатываю файл...',
                error: 'Не удалось прочитать CSV',
                success: 'Файл готов к импорту',
            });

            const preview = await promise;
            if (!document.startViewTransition) {
                updateStore(file, preview);
            } else {
                document.startViewTransition(() => updateStore(file, preview));
            }
        } catch (error) {
            console.error(error);
        }
    }

    function updateStore(file: File, preview: string[][]) {
        importState.name = file.name;
        importState.size = file.size;
        importState.step = ImportStepPreview;
        importState.preview = preview;
    }

    async function readAndPreview(file: File) {
        const text = await readCsvFile(file);
        const parsedRows = parseCsv(text, importState.separator);
        if (parsedRows.length === 0) {
            throw new Error('CSV файл пуст');
        }
        importState.rawCsvText = text;
        importState.parsedRows = parsedRows;
        return parsedRows.slice(0, 2);
    }
</script>

<div
    class={cn(
        'w-full max-w-xl rounded-lg border-2 border-dashed transition-colors',
        isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
    )}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="region"
    aria-dropeffect="link"
>
    <div class="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <div class="bg-primary/10 flex size-14 items-center justify-center rounded-full">
            <FileSpreadsheetIcon class="text-primary size-6 stroke-2" />
        </div>
        <!-- Dragging only makes sense with a mouse, so touch screens get the button alone. -->
        <p class="hidden text-base pointer-fine:block">
            {isDragging ? 'Отпустите, чтобы загрузить файл' : 'Перетащите CSV-файл сюда или'}
        </p>
        <Button onclick={() => fileInput?.click()}>Выбрать CSV-файл</Button>
        <p class="text-muted-foreground text-[13px]">Поддерживаются .csv файлы до 10 МБ</p>
        <input
            bind:this={fileInput}
            type="file"
            accept=".csv,text/csv"
            onchange={handleFileChange}
            class="hidden"
        />
    </div>
</div>
<p class="text-muted-foreground w-full max-w-xl text-sm/relaxed">
    Обязательно: координаты «широта, долгота», название и категория
</p>
<Footer
    class="border-border/50 bg-muted/20 -mx-6 -mb-6 shrink-0 gap-3 border-t px-6 py-3 max-sm:grid max-sm:auto-cols-fr max-sm:grid-flow-col max-sm:*:h-11 sm:py-4"
>
    <DialogClose class={buttonVariants({variant: 'outline'})}>Закрыть</DialogClose>
</Footer>
