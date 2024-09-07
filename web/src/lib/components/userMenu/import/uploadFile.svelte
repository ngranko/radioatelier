<script lang="ts">
    import PrimaryButton from '$lib/components/button/primaryButton.svelte';
    import TextButton from '$lib/components/button/textButton.svelte';
    import {createMutation} from '@tanstack/svelte-query';
    import toast from 'svelte-french-toast';
    import {extractPreview, uploadFile} from '$lib/api/import';
    import {importInfo} from '$lib/stores/import';
    import {createEventDispatcher} from 'svelte';

    const dispatch = createEventDispatcher();

    let uploadRef: HTMLInputElement;

    const uploadFileMutation = createMutation({
        mutationFn: uploadFile,
        onSuccess: result => {
            importInfo.update(value => ({...value, id: result.data.id}));
        },
    });

    const preview = createMutation({mutationFn: extractPreview});

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
            importInfo.update(value => ({
                ...value,
                currentStep: 2,
                preview: result.data.preview,
            }));
        } catch (error) {
            console.error(error);
        }
    }

    async function uploadAndPreview(formData: FormData) {
        await $uploadFileMutation.mutateAsync({formData});
        return $preview.mutateAsync({id: $importInfo.id, separator: $importInfo.separator});
    }

    function handleClose() {
        dispatch('close');
    }
</script>

<div class="root">
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

<style lang="scss">
    @use '../../../../styles/colors';
    @use '../../../../styles/typography';

    .root {
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
</style>
