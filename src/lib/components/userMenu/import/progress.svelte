<script lang="ts">
    import {api} from '$convex/_generated/api';
    import type {Doc, Id} from '$convex/_generated/dataModel';
    import {DialogClose, DialogFooter} from '$lib/components/ui/dialog';
    import type {ImportJobSnapshot} from '$lib/interfaces/import';
    import {Progress} from '$lib/components/ui/progress';
    import {applyImportJobSnapshot, importState} from '$lib/state/import.svelte.ts';
    import {useQuery} from 'convex-svelte';
    import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';

    function toImportJobSnapshot(job: Doc<'importJobs'> | null): ImportJobSnapshot | null {
        if (!job) {
            return null;
        }

        return {
            id: job._id,
            status: job.status,
            totalRows: job.totalRows,
            processedRows: job.processedRows,
            successfulRows: job.successfulRows,
            percentage: job.percentage,
            startedAt: job.startedAt,
            finishedAt: job.finishedAt,
            globalError: job.globalError,
            feedback: job.feedback,
        };
    }

    const importJob = useQuery(api.imports.getJob, {
        jobId: importState.importJobId as Id<'importJobs'>,
    });

    $effect(() => {
        applyImportJobSnapshot(toImportJobSnapshot(importJob.data ?? null));
    });
</script>

<div class="flex flex-1 items-center justify-center pt-12 pb-6">
    <div class="w-full max-w-md space-y-6">
        <div class="flex flex-col items-center gap-4">
            <div class="bg-primary/10 flex h-16 w-16 items-center justify-center rounded-full">
                <LoaderCircleIcon class="text-primary size-6 animate-spin stroke-2" />
            </div>
            <div class="space-y-2 text-center">
                <p class="text-lg font-medium">Импортирую данные...</p>
            </div>
        </div>

        <div class="space-y-2">
            <Progress value={importState.percentage} class="h-2" />
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
    <DialogClose>Отменить</DialogClose>
</DialogFooter>
