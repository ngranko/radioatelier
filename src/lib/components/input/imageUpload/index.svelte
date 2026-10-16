<script lang="ts">
    import type {Id} from '$convex/_generated/dataModel';
    import ImageViewer from '$lib/components/imageViewer/imageViewer.svelte';
    import Carousel from '$lib/components/input/imageUpload/carousel.svelte';
    import CropDialog from '$lib/components/input/imageUpload/cropDialog.svelte';
    import EmptyPlaceholder from '$lib/components/input/imageUpload/emptyPlaceholder.svelte';
    import {
        IMAGE_INPUT_ACCEPT,
        selectUploadable,
    } from '$lib/components/input/imageUpload/imageTypes';
    import LoadingOverlay from '$lib/components/input/imageUpload/loadingOverlay.svelte';
    import Thumbnails from '$lib/components/input/imageUpload/thumbnails.svelte';
    import {Button} from '$lib/components/ui/button';
    import type {ObjectImage} from '$lib/interfaces/object';
    import {MAX_OBJECT_IMAGES} from '$lib/utils/fieldLimits';
    import StarIcon from '@lucide/svelte/icons/star';
    import TrashIcon from '@lucide/svelte/icons/trash-2';
    import UploadIcon from '@lucide/svelte/icons/upload';
    import {onMount, tick} from 'svelte';
    import {toast} from 'svelte-sonner';

    interface Props {
        id?: string;
        name?: string;
        value?: string | null;
        /** In display order; the first one is the cover. */
        images?: ObjectImage[];
        disabled?: boolean;
        isUploading?: boolean;
        categoryId?: Id<'categories'> | null;
        initialFile?: File;
        /** Uploads the file and appends it to `images`. */
        onChange(file: File): void | Promise<void>;
    }

    let {
        id,
        name,
        value,
        images = $bindable([]),
        disabled = false,
        isUploading = $bindable(false),
        categoryId = null,
        initialFile,
        onChange,
    }: Props = $props();

    let isViewerOpen = $state(false);
    let imageUploadRef: HTMLInputElement | undefined = $state();
    let carousel: Carousel | undefined = $state();
    let index = $state(0);
    let current = $derived<ObjectImage | undefined>(images[Math.min(index, images.length - 1)]);
    let isCover = $derived(current === images[0]);
    let isFull = $derived(images.length >= MAX_OBJECT_IMAGES);

    async function handleImageChange(event: Event) {
        const input = event.target as HTMLInputElement;
        const files = [...(input.files ?? [])];
        // lets the same file be picked again after it was removed
        input.value = '';

        if (!files.length) {
            console.error('Не удалось получить файл');
            toast.warning('Не удалось загрузить изображение');
            return;
        }

        await uploadFiles(files);
    }

    async function uploadFiles(files: File[]) {
        const uploadable = selectUploadable(files, MAX_OBJECT_IMAGES - images.length);
        if (!uploadable.length) {
            return;
        }

        isUploading = true;
        try {
            for (const file of uploadable) {
                await onChange(file);
            }
        } finally {
            isUploading = false;
            await tick();
            carousel?.show(images.length - 1);
        }
    }

    onMount(() => {
        if (initialFile) {
            uploadFiles([initialFile]).catch(() => {
                // onChange already reports upload failures through its toast.
            });
        }
    });

    function handlePreviewChange(imageId: string, previewUrl: string) {
        images = images.map(image => (image.id === imageId ? {...image, previewUrl} : image));
    }

    function handleRemoveClick() {
        const removed = current;
        images = images.filter(image => image !== removed);
    }

    function handleCoverClick() {
        const cover = current!;
        images = [cover, ...images.filter(image => image !== cover)];
        carousel?.show(0);
    }
</script>

<div class="bg-muted/30 border-border relative w-full overflow-hidden rounded-lg border">
    {#if images.length}
        <Carousel
            bind:this={carousel}
            bind:index
            {images}
            coverId={disabled || images.length < 2 ? undefined : images[0].id}
            disabled={isUploading}
            onOpen={() => (isViewerOpen = true)}
        />
    {:else}
        <EmptyPlaceholder {categoryId} />
    {/if}

    {#if isUploading}
        <LoadingOverlay />
    {/if}
    {#if !disabled}
        <div class="absolute right-3 bottom-3 flex gap-2">
            <Button
                variant="secondary"
                size="icon"
                class="text-foreground/80 hover:bg-secondary/90 shadow-sm"
                onclick={() => imageUploadRef?.click()}
                disabled={isUploading || isFull}
                aria-label="Загрузить изображение"
            >
                <UploadIcon />
            </Button>
            {#if current && !isUploading}
                {#if current.url}
                    {#key current.id}
                        <CropDialog
                            imageId={current.id}
                            imageUrl={current.url}
                            onChange={url => handlePreviewChange(current.id, url)}
                        />
                    {/key}
                {/if}
                {#if images.length > 1}
                    <Button
                        variant="secondary"
                        size="icon"
                        class="text-foreground/80 shadow-sm"
                        onclick={handleCoverClick}
                        aria-pressed={isCover}
                        aria-label={isCover ? 'Это обложка' : 'Сделать обложкой'}
                        title={isCover ? 'Это обложка' : 'Сделать обложкой'}
                    >
                        <StarIcon class={isCover ? 'text-primary fill-current' : ''} />
                    </Button>
                {/if}
                <Button
                    variant="secondary"
                    size="icon"
                    class="text-destructive hover:text-destructive"
                    onclick={handleRemoveClick}
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
        accept={IMAGE_INPUT_ACCEPT}
        multiple
        onchange={handleImageChange}
        {disabled}
    />

    {#if images.length}
        <ImageViewer
            bind:isOpen={isViewerOpen}
            urls={images.map(image => image.url)}
            bind:index={() => index, target => carousel?.show(target, 'instant')}
        />
    {/if}
</div>
{#if !disabled && images.length > 1}
    <Thumbnails
        bind:images
        {index}
        disabled={isUploading}
        onSelect={target => carousel?.show(target)}
    />
{/if}
