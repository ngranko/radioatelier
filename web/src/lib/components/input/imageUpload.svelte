<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import CropDialog from '$lib/components/input/imageUpload/cropDialog.svelte';
    import ImageViewer from '$lib/components/input/imageUpload/imageViewer.svelte';
    import {toast} from 'svelte-sonner';
    import {activeObject} from '$lib/state/activeObject.svelte.ts';
    import type {Object} from '$lib/interfaces/object.ts';

    interface Props {
        id?: string;
        name?: string;
        value?: string;
        disabled?: boolean;
        url?: string;
        previewUrl?: string;
        onChange(file: File): void;
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

    let imageUploadRef: HTMLInputElement | undefined = $state();

    function handleImageChange(event: Event) {
        const file = (event.target as HTMLInputElement).files?.[0];

        if (!file) {
            toast.warning('Не удалось загрузить изображение');
            return;
        }

        onChange(file);
    }

    function handlePreviewChange(newPreviewUrl: string) {
        previewUrl = newPreviewUrl;
        (activeObject.object as Object).cover.previewUrl = newPreviewUrl;
    }

    function handleUploadClick() {
        imageUploadRef?.click();
    }

    function handleRemoveClick() {
        value = undefined;
    }

    function handleViewerOpen() {
        if (url) {
            isViewerOpen = true;
        }
    }

    function getImageUrl(): string {
        return previewUrl || url || '/image_empty.jpg';
    }
</script>

<div class="relative w-full overflow-hidden rounded-lg border-2 border-gray-200 bg-gray-50">
    <button
        type="button"
        class="block aspect-2/1 w-full border-none bg-cover bg-center bg-no-repeat"
        style="background-image:url('{getImageUrl()}')"
        onclick={handleViewerOpen}
        aria-label="Изображение"
    ></button>
    {#if !disabled}
        <div class="absolute right-3 bottom-3 flex gap-3">
            <Button
                variant="secondary"
                size="icon"
                class="text-base text-black hover:bg-gray-200"
                onclick={handleUploadClick}
                aria-label="Загрузить изображение"
            >
                <i class="fa-solid fa-arrow-up-from-bracket"></i>
            </Button>
            {#if value}
                {#if url}
                    <CropDialog imageId={value} imageUrl={url} onChange={handlePreviewChange} />
                {/if}
                <Button
                    variant="secondary"
                    size="icon"
                    class="text-destructive text-base"
                    onclick={handleRemoveClick}
                    aria-label="Удалить изображение"
                >
                    <i class="fa-solid fa-trash"></i>
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
        accept="image/jpeg,image/png"
        onchange={handleImageChange}
        {disabled}
    />

    {#if url}
        <ImageViewer bind:isOpen={isViewerOpen} {url} />
    {/if}
</div>
