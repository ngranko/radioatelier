<script lang="ts">
    import {toast} from 'svelte-sonner';
    import {ImportStepPreview} from '$lib/interfaces/import.ts';
    import {importState} from '$lib/state/import.svelte.ts';
    import {parseCsv, readCsvFile} from '$lib/services/import/csv';

    let isDragging = $state(false);

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

<!-- prettier-ignore -->
<div
    class={`w-full max-w-xl rounded-lg border-2 border-dashed transition-colors ${
        isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-muted-foreground/50'
    }`}
    ondragover={handleDragOver}
    ondragleave={handleDragLeave}
    ondrop={handleDrop}
    role="region"
    aria-dropeffect="link"
>
    <label class="flex cursor-pointer flex-col items-center justify-center gap-4 px-6 py-16">
        <div class="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
            <i class="fa-solid fa-file-csv text-primary text-2xl ml-1"></i>
        </div>
        <div class="space-y-2 text-center">
            <p class="text-lg">
                {isDragging ? 'Перетащите файл сюда' : 'Перетащите ваш CSV файл сюда'}
            </p>
            <p class="text-muted-foreground text-sm">
                или <span class="text-primary">нажмите</span>, чтобы выбрать файл
            </p>
        </div>
        <div class="text-muted-foreground text-xs">Поддерживаются .csv файлы до 10MB</div>
        <input type="file" accept=".csv,text/csv" onchange={handleFileChange} class="hidden" />
    </label>
</div>
