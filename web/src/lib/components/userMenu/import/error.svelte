<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {DialogClose, DialogFooter} from '$lib/components/ui/dialog';
    import {importState, resetImportState} from '$lib/state/import.svelte.ts';

    function handleReset() {
        resetImportState();
    }
</script>

<div class="flex flex-1 items-center justify-center pt-12 pb-6">
    <div class="w-full max-w-md space-y-6">
        <div class="flex flex-col items-center gap-4">
            <div class="bg-destructive/10 flex h-16 w-16 items-center justify-center rounded-full">
                <i class="fa-regular fa-circle-xmark text-destructive text-2xl"></i>
            </div>
            <div class="space-y-2 text-center">
                <p class="text-lg font-medium">Импорт провалился</p>
                <p class="text-muted-foreground text-sm">Процесс импорта завершился с ошибкой</p>
            </div>
        </div>

        <div class="bg-destructive/5 border-destructive/30 rounded-lg border p-4">
            <p class="text-destructive text-sm font-medium">Детали:</p>
            <p class="text-destructive/80 mt-1 text-sm">
                {importState.globalError}
            </p>
        </div>
    </div>
</div>
<DialogFooter>
    <DialogClose>
        <Button variant="ghost">Закрыть</Button>
    </DialogClose>
    <Button variant="primary" onclick={handleReset}>Импортировать другой файл</Button>
</DialogFooter>
