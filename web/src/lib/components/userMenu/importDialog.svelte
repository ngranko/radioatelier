<script lang="ts">
    import Dialog from '$lib/components/dialog.svelte';
    import PrimaryButton from '$lib/components/button/primaryButton.svelte';
    import TextButton from '$lib/components/button/textButton.svelte';
    import {createMutation, createQuery} from '@tanstack/svelte-query';
    import toast from 'svelte-french-toast';
    import {getPreview, uploadFile} from '$lib/api/import';

    export let isOpen = false;

    let currentStep = 1;
    let uploadRef: HTMLInputElement;
    let preview: string[][] = [];
    let fileId: string;
    let separator: string = ';';

    const uploadFileMutation = createMutation({
        mutationFn: uploadFile,
        onSuccess: result => {
            fileId = result.data.id;
        },
    });

    const getPreviewQuery = createQuery({
        queryKey: ['preview'],
        queryFn: () => getPreview({id: fileId, separator}),
        enabled: false,
        staleTime: 0,
    });

    function handleClick() {
        uploadRef.click();
    }

    async function handleFileChange(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (!file) {
            console.error('no file selected');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        try {
            const result = await toast.promise(uploadAndPreview(formData), {
                loading: 'Загружаю файл...',
                error: 'Не удалось загрузить файл',
                success: 'Файл загружен',
            });
            preview = result.data?.data.preview ?? [];
            currentStep = 2;
        } catch (error) {
            console.error(error);
        }
    }

    async function uploadAndPreview(formData: FormData) {
        await $uploadFileMutation.mutateAsync({formData});
        const result = await $getPreviewQuery.refetch();
        if (result.isError) {
            throw new Error('Failed getting the preview');
        }
        return result;
    }

    function handleClose() {
        isOpen = false;
        currentStep = 1;
    }

    $: console.log(preview);
    $: console.log(preview.length);
</script>

<Dialog bind:isOpen on:close={handleClose}>
    {#if currentStep === 1}
        <div class="step1">
            <h2>Импорт csv</h2>
            <input
                bind:this={uploadRef}
                class="upload"
                type="file"
                accept="text/csv"
                on:change={handleFileChange}
            />
            <PrimaryButton on:click={handleClick}>Выбрать файл</PrimaryButton>
            <TextButton on:click={handleClose}>Отменить</TextButton>
        </div>
    {:else if currentStep === 2}
        <div class="step2">
            <h2>Импорт csv</h2>
            <div class="preview">
                {#each preview as row}
                    <div class="row">
                        {#each row as cell}
                            <div class="cell">{cell}</div>
                        {/each}
                    </div>
                {/each}
            </div>
            <form>
                Название
                <select>
                    <option value={null}>Не заполнять</option>
                    {#each preview[0] ?? [] as cell, i}
                        <option value={i}>{cell}</option>
                    {/each}
                </select>
            </form>
        </div>
    {/if}
</Dialog>

<style lang="scss">
    @use '../../../styles/typography';

    .step1 {
        width: 240px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 16px;
    }

    .upload {
        display: none;
    }

    .step2 {
        width: 100%;
        max-width: 600px;
    }

    .preview {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }

    .row {
        display: table-row;
    }

    .cell {
        min-width: 40px;
        display: table-cell;
        padding: 8px 16px;
        border: 1px solid #ddd;
    }
</style>
