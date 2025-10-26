<script lang="ts">
    import {createMutation} from '@tanstack/svelte-query';
    import toast from 'svelte-5-french-toast';
    import {extractPreview} from '$lib/api/import';
    import {Label} from '$lib/components/ui/label';
    import {Button} from '$lib/components/ui/button';
    import * as Select from '$lib/components/ui/select';
    import {importState, resetImportState} from '$lib/state/import.svelte.ts';

    const preview = createMutation({mutationFn: extractPreview});

    function getSeparator() {
        return importState.separator;
    }

    async function handleSeparatorChange(separator: string) {
        try {
            const result = await toast.promise(
                $preview.mutateAsync({id: importState.id, separator}),
                {
                    loading: 'Обновляю превью...',
                    error: 'Не удалось обновить превью',
                    success: 'Превью обновлено',
                },
            );
            importState.separator = separator;
            importState.preview = result.data.preview;
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
                <i class="fa-solid fa-file-csv text-primary ml-1 text-2xl"></i>
            </div>
            <div>
                <p class="font-bold">{importState.name}</p>
                <p class="text-muted-foreground text-sm">
                    {(importState.size / 1024).toFixed(1)} KB
                </p>
            </div>
        </div>
        <Button variant="outline" size="icon" onclick={handleRemoveFile}>
            <i class="fa-solid fa-trash text-destructive"></i>
        </Button>
    </div>
    <div class="pl-[52px]">
        <Label class="text-sm whitespace-nowrap">
            Разделитель
            <!-- prettier-ignore -->
            <Select.Root type="single" bind:value={getSeparator, handleSeparatorChange}>
                    <Select.Trigger id="separator" class="w-20">
                        {getSeparatorLabel()}
                    </Select.Trigger>
                    <Select.Content>
                        <Select.Item value=";">;</Select.Item>
                        <Select.Item value={"\t"}>Tab</Select.Item>
                        <Select.Item value="|">|</Select.Item>
                    </Select.Content>
                </Select.Root>
        </Label>
    </div>
</div>
