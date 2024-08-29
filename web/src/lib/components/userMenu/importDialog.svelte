<script lang="ts">
    import Dialog from '$lib/components/dialog.svelte';
    import PrimaryButton from '$lib/components/button/primaryButton.svelte';
    import TextButton from '$lib/components/button/textButton.svelte';
    import Form from '$lib/components/userMenu/import/form.svelte';
    import {createMutation, createQuery} from '@tanstack/svelte-query';
    import toast from 'svelte-french-toast';
    import {getPreview, uploadFile} from '$lib/api/import';
    import Svelecte from 'svelecte';

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

    async function handleSeparatorChange() {
        try {
            const result = await toast.promise($getPreviewQuery.refetch(), {
                loading: 'Обновляю превью...',
                error: 'Не удалось обновить превью',
                success: 'Превью обновлено',
            });
            preview = result.data?.data.preview ?? [];
        } catch (error) {
            console.error(error);
        }
    }
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
            <h3>Превью</h3>
            <div class="preview">
                {#each preview as row}
                    <div class="row">
                        {#each row as cell}
                            <div class="cell">{cell}</div>
                        {/each}
                    </div>
                {/each}
                <div class="row">
                    {#each preview[0] as _, i}
                        <div class="cell">{i === 0 ? '...' : ''}</div>
                    {/each}
                </div>
            </div>
            <div class="changeSeparator">
                <label for="separator" class="separatorLabel">
                    Неверное превью? Попробуйте сменить разделитель:
                </label>
                <Svelecte
                    bind:value={separator}
                    inputId="separator"
                    on:change={handleSeparatorChange}
                    options={[
                        {value: ';', text: ';'},
                        {value: ',', text: ','},
                        {value: '|', text: '|'},
                        {value: '\t', text: 'Tab'},
                    ]}
                    class="importSeparatorSelect"
                />
            </div>
            <h3>Импортировать колонки</h3>
            <Form {preview} />
        </div>
    {/if}
</Dialog>

<style lang="scss">
    @use '../../../styles/colors';
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
        @include typography.size-14;
        margin: 0 -24px;
        margin-bottom: 16px;
        padding: 0 24px;
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
    }

    .row {
        display: table-row;
    }

    .cell {
        max-width: 160px;
        display: table-cell;
        padding: 8px 16px;
        border: 1px solid colors.$lightgray;
        text-overflow: ellipsis;
        text-wrap: nowrap;
        overflow: hidden;
    }

    .changeSeparator {
        @include typography.size-14;
    }

    .separatorLabel {
        margin-right: 8px;
    }

    :global(.importSeparatorSelect) {
        display: inline-block;
        border-color: colors.$gray;
    }
</style>
