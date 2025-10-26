<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {DialogClose, DialogFooter} from '$lib/components/ui/dialog';
    import {Progress} from '$lib/components/ui/progress';
    import {importState} from '$lib/state/import.svelte.ts';
</script>

<div class="flex flex-1 items-center justify-center pt-12 pb-6">
    <div class="w-full max-w-md space-y-6">
        <div class="flex flex-col items-center gap-4">
            <div class="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
                <i class="fa-solid fa-circle-notch text-primary animate-spin text-2xl"></i>
            </div>
            <div class="space-y-2 text-center">
                <p class="text-lg font-medium">Импортирую данные...</p>
            </div>
        </div>

        <div class="space-y-2">
            <Progress value={importState.percentage} className="h-2" />
            <div class="text-muted-foreground flex justify-between text-sm">
                <span>{importState.percentage}% завершено</span>
            </div>
        </div>

        <div class="bg-muted/30 rounded-lg border p-4">
            <p class="text-muted-foreground text-center text-sm">
                Пожалуйста, не закрывайте окно, пока импорт не завершен
            </p>
        </div>
    </div>
</div>
<DialogFooter>
    <DialogClose>
        <Button variant="ghost">Отменить</Button>
    </DialogClose>
</DialogFooter>
