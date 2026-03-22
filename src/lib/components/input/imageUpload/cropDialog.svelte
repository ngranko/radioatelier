<script lang="ts">
    import {api} from '$convex/_generated/api';
    import type {Id} from '$convex/_generated/dataModel';
    import {Button} from '$lib/components/ui/button';
    import {
        Root as DialogRoot,
        Content,
        DialogTitle,
        DialogTrigger,
    } from '$lib/components/ui/dialog';
    import {DialogClose} from '$lib/components/ui/dialog/index.js';
    import {useConvexClient} from 'convex-svelte';
    import Cropper from 'svelte-easy-crop';
    import {toast} from 'svelte-sonner';
    import XMarkIcon from '@lucide/svelte/icons/x';
    import PlusIcon from '@lucide/svelte/icons/plus';
    import MinusIcon from '@lucide/svelte/icons/minus';
    import LoaderCircleIcon from '@lucide/svelte/icons/loader-circle';
    import MoveIcon from '@lucide/svelte/icons/move';

    type CropArea = {
        x: number;
        y: number;
        width: number;
        height: number;
    };

    interface Props {
        imageId: string;
        imageUrl: string;
        onChange(url: string): void;
    }

    const client = useConvexClient();
    let {imageId, imageUrl, onChange}: Props = $props();

    let isOpen = $state(false);
    let crop = $state({x: 0, y: 0});
    let zoom = $state(1);
    let currentPosition = $state<CropArea>({x: 0, y: 0, width: 0, height: 0});
    let isSubmitting = $state(false);

    const MIN_ZOOM = 1;
    const MAX_ZOOM = 3;
    const ZOOM_STEP = 0.1;

    let zoomPercent = $derived(Math.round(((zoom - MIN_ZOOM) / (MAX_ZOOM - MIN_ZOOM)) * 100));

    async function handleCrop(details: {pixels: CropArea}) {
        currentPosition = details.pixels;
    }

    function handleZoomInput(e: Event) {
        const target = e.target as HTMLInputElement;
        zoom = parseFloat(target.value);
    }

    function nudgeZoom(delta: number) {
        zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom + delta));
    }

    async function uploadPreview(file: File) {
        const uploadUrl = await client.mutation(api.images.generateUploadUrl, {});
        const result = await fetch(uploadUrl, {
            method: 'POST',
            headers: {'Content-Type': file.type},
            body: file,
        });
        if (!result.ok) {
            throw new Error('Не удалось загрузить кадрированное изображение');
        }

        const {storageId} = (await result.json()) as {storageId?: Id<'_storage'>};
        if (!storageId) {
            throw new Error('Не удалось получить ID загруженного изображения');
        }

        return client.mutation(api.images.updatePreview, {
            id: imageId as Id<'images'>,
            storageId,
        });
    }

    async function createCroppedFile(imageSourceUrl: string, area: CropArea): Promise<File> {
        const response = await fetch(imageSourceUrl);
        if (!response.ok) {
            throw new Error('Не удалось загрузить изображение для кадрирования');
        }

        const sourceBlob = await response.blob();
        const sourceBitmap = await createImageBitmap(sourceBlob);
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(area.width));
        canvas.height = Math.max(1, Math.round(area.height));

        const context = canvas.getContext('2d');
        if (!context) {
            throw new Error('Не удалось получить canvas-контекст');
        }

        context.drawImage(
            sourceBitmap,
            area.x,
            area.y,
            area.width,
            area.height,
            0,
            0,
            canvas.width,
            canvas.height,
        );
        sourceBitmap.close();

        const croppedBlob = await new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                blob => {
                    if (!blob) {
                        reject(new Error('Не удалось подготовить кадрированное изображение'));
                        return;
                    }
                    resolve(blob);
                },
                'image/jpeg',
                0.9,
            );
        });

        return new File([croppedBlob], 'preview.jpg', {
            type: 'image/jpeg',
            lastModified: Date.now(),
        });
    }

    async function handleClick() {
        toast.promise(doHandleClick(), {
            loading: 'Обновляю превью...',
            success: 'Превью обновлено!',
            error: 'Не получилось обновить превью',
        });
    }

    async function doHandleClick() {
        isSubmitting = true;
        try {
            if (currentPosition.width <= 0 || currentPosition.height <= 0) {
                throw new Error('Не удалось определить область кадрирования');
            }
            const croppedFile = await createCroppedFile(imageUrl, currentPosition);
            const {previewUrl} = await uploadPreview(croppedFile);
            onChange(previewUrl);
            isOpen = false;
        } catch (error) {
            console.error('Failed to update preview:', error);
            throw error;
        } finally {
            isSubmitting = false;
        }
    }
</script>

<DialogRoot bind:open={isOpen}>
    <DialogTrigger type="button">
        <Button variant="secondary" size="icon" aria-label="Кадрировать превью">
            <MoveIcon />
        </Button>
    </DialogTrigger>
    <Content
        showCloseButton={false}
        class="flex h-[92vh] flex-col gap-0 overflow-hidden rounded-2xl border bg-zinc-50 p-0 sm:max-w-2xl dark:bg-zinc-950"
    >
        <div class="flex shrink-0 items-center justify-between border-b px-5 py-3.5">
            <DialogTitle class="text-sm font-medium tracking-wide text-zinc-600 dark:text-zinc-300">
                Кадрирование превью
            </DialogTitle>
            <DialogClose
                class="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-white/8 dark:hover:text-zinc-300"
                disabled={isSubmitting}
            >
                <XMarkIcon class="size-3.5 stroke-3" />
            </DialogClose>
        </div>

        <div class="relative min-h-0 flex-1 bg-zinc-100 dark:bg-zinc-900/80">
            <Cropper
                bind:crop
                bind:zoom
                aspect={2}
                image={imageUrl}
                showGrid={false}
                oncropcomplete={handleCrop}
            />
        </div>

        <div class="flex shrink-0 flex-col gap-4 border-t px-5 py-4">
            <div class="flex items-center gap-3">
                <button
                    type="button"
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-white/8 dark:hover:text-zinc-300"
                    onclick={() => nudgeZoom(-ZOOM_STEP)}
                    disabled={zoom <= MIN_ZOOM}
                    aria-label="Уменьшить"
                >
                    <MinusIcon class="size-3.5 stroke-3" />
                </button>

                <div class="relative flex flex-1 items-center">
                    <input
                        type="range"
                        min={MIN_ZOOM}
                        max={MAX_ZOOM}
                        step="0.01"
                        value={zoom}
                        oninput={handleZoomInput}
                        class="[&::-webkit-slider-thumb]:bg-foreground h-[3px] w-full cursor-pointer appearance-none rounded-full outline-none [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_1px_4px_rgb(0_0_0/0.3)] [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:shadow-[0_0_0_1px_rgb(0_0_0/0.1),0_1px_4px_rgb(0_0_0/0.3)] [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:duration-150 [&::-webkit-slider-thumb:active]:scale-110 [&::-webkit-slider-thumb:hover]:scale-120"
                        style="background: linear-gradient(to right, var(--primary) 0%, var(--primary) {zoomPercent}%, var(--border) {zoomPercent}%, var(--border) 100%)"
                        aria-label="Масштаб"
                    />
                </div>

                <button
                    type="button"
                    class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-zinc-400 transition-colors hover:bg-black/5 hover:text-zinc-600 dark:text-zinc-500 dark:hover:bg-white/8 dark:hover:text-zinc-300"
                    onclick={() => nudgeZoom(ZOOM_STEP)}
                    disabled={zoom >= MAX_ZOOM}
                    aria-label="Увеличить"
                >
                    <PlusIcon class="size-3.5 stroke-3" />
                </button>

                <span class="text-muted-foreground w-10 text-right font-mono text-xs tabular-nums">
                    {zoomPercent}%
                </span>
            </div>

            <div class="flex items-center justify-end gap-2.5">
                <DialogClose disabled={isSubmitting}>
                    <Button
                        variant="ghost"
                        size="sm"
                        class="hover:bg-black/5 dark:hover:bg-white/8"
                        disabled={isSubmitting}
                    >
                        Отмена
                    </Button>
                </DialogClose>
                <Button size="sm" onclick={handleClick} disabled={isSubmitting} class="min-w-24">
                    {#if isSubmitting}
                        <LoaderCircleIcon class="animate-spin" />
                    {/if}
                    Применить
                </Button>
            </div>
        </div>
    </Content>
</DialogRoot>
