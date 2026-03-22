<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {DialogClose, DialogFooter} from '$lib/components/ui/dialog';
    import {importState, resetImportState} from '$lib/state/import.svelte.ts';
    import CheckCircleIcon from '@lucide/svelte/icons/check-circle';
    import CircleXMarkIcon from '@lucide/svelte/icons/circle-x';
    import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

    const warningCount = $derived(
        importState.lineFeedback.filter(item => item.severity === 'warning').length,
    );
    const errorCount = $derived(
        importState.lineFeedback.filter(item => item.severity === 'error').length,
    );

    function handleReset() {
        resetImportState();
    }
</script>

<div class="flex-1 space-y-6 overflow-y-auto">
    <div class="flex flex-col items-center gap-4 py-6">
        <div class="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircleIcon class="size-6 stroke-2 text-green-600" />
        </div>
        <div class="space-y-2 text-center">
            <p class="text-lg font-medium">Импорт успешно завершен</p>
            <p class="text-muted-foreground text-sm">
                {importState.successfulRows} из {importState.totalRows} строк имнортировано
            </p>
        </div>
    </div>

    <div class="grid grid-cols-3 gap-4">
        <div class="bg-card rounded-lg border p-4 text-center">
            <p class="text-2xl font-bold text-green-600">{importState.successfulRows}</p>
            <p class="text-muted-foreground mt-1 text-sm">Успешно</p>
        </div>
        <div class="bg-card rounded-lg border p-4 text-center">
            <p class="text-2xl font-bold text-amber-600">{warningCount}</p>
            <p class="text-muted-foreground mt-1 text-sm">Предупреждений</p>
        </div>
        <div class="bg-card rounded-lg border p-4 text-center">
            <p class="text-destructive text-2xl font-bold">{errorCount}</p>
            <p class="text-muted-foreground mt-1 text-sm">Ошибок</p>
        </div>
    </div>

    {#if importState.lineFeedback.length > 0}
        <div class="space-y-3">
            <h3 class="text-base font-semibold">Найденные проблемы</h3>
            <div class="bg-card max-h-64 overflow-y-auto rounded-lg border">
                <div class="divide-y">
                    {#each importState.lineFeedback as item (item.line)}
                        <div class="flex items-start gap-3 p-4">
                            {#if item.severity === 'error'}
                                <CircleXMarkIcon
                                    class="text-destructive mt-0.5 size-5 flex-shrink-0"
                                />
                            {:else}
                                <TriangleAlertIcon
                                    class="mt-0.5 size-5 flex-shrink-0 text-amber-600"
                                />
                            {/if}
                            <div class="min-w-0 flex-1">
                                <span class="text-sm font-medium">Строка {item.line}</span>
                                <p class="text-muted-foreground mt-1 text-sm">
                                    {item.text}
                                </p>
                            </div>
                        </div>
                    {/each}
                </div>
            </div>
        </div>
    {/if}
</div>
<DialogFooter class="gap-4">
    <DialogClose>Закрыть</DialogClose>
    <Button onclick={handleReset}>Импортировать другой файл</Button>
</DialogFooter>
