<script lang="ts">
    import EmptyPlaceholder from '$lib/components/input/imageUpload/emptyPlaceholder.svelte';
    import {Button} from '$lib/components/ui/button';
    import CropDialog from '$lib/components/input/imageUpload/cropDialog.svelte';
    import ImageViewer from '$lib/components/input/imageUpload/imageViewer.svelte';
    import {toast} from 'svelte-sonner';
    import LoadingOverlay from '$lib/components/input/imageUpload/loadingOverlay.svelte';
    import TrashIcon from '@lucide/svelte/icons/trash-2';
    import UploadIcon from '@lucide/svelte/icons/upload';

    interface Props {
        id?: string;
        name?: string;
        value?: string;
        disabled?: boolean;
        url?: string;
        previewUrl?: string;
        onChange(file: File): void | Promise<void>;
    }

    let {
        id,
        name,
        value = $bindable(),
        disabled = false,
        url = $bindable(),
        previewUrl = $bindable(),
        onChange,
    }: Props = $props();

    let isViewerOpen = $state(false);
    let isUploading = $state(false);
    let imageUploadRef: HTMLInputElement | undefined = $state();
    let displayUrl = $derived(previewUrl || url);

    const SUPPORTED_IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp']);

    async function handleImageChange(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (!file) {
            console.error('Не удалось получить файл');
            toast.warning('Не удалось загрузить изображение');
            return;
        }

        if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
            console.error('Неподдерживаемый тип файла', file.type);
            toast.warning('Неподдерживаемый тип файла');
            return;
        }

        isUploading = true;
        try {
            await onChange(file);
        } finally {
            isUploading = false;
        }
    }

    function handlePreviewChange(newPreviewUrl: string) {
        previewUrl = newPreviewUrl;
    }

    function handleUploadClick() {
        imageUploadRef?.click();
    }

    function handleRemoveClick() {
        value = undefined;
        url = undefined;
        previewUrl = undefined;
    }

    function handleViewerOpen() {
        if (displayUrl) {
            isViewerOpen = true;
        }
    }
</script>

<div class="bg-muted/30 border-border relative w-full overflow-hidden rounded-lg border">
    {#if displayUrl}
        <button
            type="button"
            class="group bg-muted relative block aspect-2/1 w-full cursor-zoom-in border-none"
            onclick={handleViewerOpen}
            disabled={isUploading}
            aria-label="Открыть оригинал изображения"
            aria-busy={isUploading}
        >
            <img
                class="h-full w-full object-cover transition-transform ease-out group-hover:scale-[1.03]"
                src={displayUrl}
                alt="Изображение"
            />
        </button>
    {:else}
        <EmptyPlaceholder />
    {/if}

    {#if isUploading}
        <LoadingOverlay />
    {/if}
    {#if !disabled}
        <div class="absolute right-3 bottom-3 flex gap-3">
            <Button
                variant="secondary"
                size="icon"
                class="text-foreground/80 hover:bg-secondary/90 shadow-sm"
                onclick={handleUploadClick}
                disabled={isUploading}
                aria-label="Загрузить изображение"
            >
                <UploadIcon />
            </Button>
            {#if value && !isUploading}
                {#if url}
                    <CropDialog imageId={value} imageUrl={url} onChange={handlePreviewChange} />
                {/if}
                <Button
                    variant="secondary"
                    size="icon"
                    class="text-destructive hover:text-destructive"
                    onclick={handleRemoveClick}
                    disabled={isUploading}
                    aria-label="Удалить изображение"
                >
                    <TrashIcon />
                </Button>
            {/if}
        </div>
    {/if}
    <input type="hidden" {name} {value} />
    <input
        bind:this={imageUploadRef}
        class="hidden"
        {id}
        type="file"
        accept={[...SUPPORTED_IMAGE_TYPES].join(',')}
        onchange={handleImageChange}
        {disabled}
    />

    {#if url}
        <ImageViewer bind:isOpen={isViewerOpen} {url} />
    {/if}
</div>
