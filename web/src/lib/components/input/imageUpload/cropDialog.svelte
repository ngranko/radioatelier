<script lang="ts">
    import {Button} from '$lib/components/ui/button';
    import {
        Root as DialogRoot,
        Content,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from '$lib/components/ui/dialog';
    import Cropper from 'svelte-easy-crop';
    import {createMutation} from '@tanstack/svelte-query';
    import {createPreview} from '$lib/api/image.ts';
    import type {Position} from '$lib/interfaces/image.ts';
    import {DialogClose, DialogFooter} from '$lib/components/ui/dialog/index.js';
    import {toast} from 'svelte-sonner';

    interface Props {
        imageId: string;
        imageUrl: string;
        onChange(url: string): void;
    }

    let {imageId, imageUrl, onChange}: Props = $props();

    let isOpen = $state(false);
    let crop = $state({x: 0, y: 0});
    let zoom = $state(1);
    let currentPosition = $state({x: 0, y: 0, width: 0, height: 0});
    let isSubmitting = $state(false);

    const createPreviewMutation = createMutation({
        mutationFn: createPreview,
        onSuccess: ({data}) => {
            onChange(data.previewUrl);
        },
    });

    async function handleCrop(details: {pixels: Position}) {
        currentPosition = details.pixels;
    }

    async function handleClick() {
        isSubmitting = true;
        try {
            await $createPreviewMutation.mutateAsync({
                id: imageId,
                position: currentPosition,
            });
            isOpen = false;
        } catch (error) {
            toast.error('Не получилось обновить превью');
        }
        isSubmitting = false;
    }
</script>

<DialogRoot bind:open={isOpen}>
    <DialogTrigger>
        <Button variant="secondary" size="icon" class="text-base" aria-label="Кадрировать превью">
            <i class="fa-solid fa-up-down-left-right"></i>
        </Button>
    </DialogTrigger>
    <Content class="flex max-h-[95vh] flex-col">
        <DialogHeader>
            <DialogTitle>Кадрировать превью</DialogTitle>
        </DialogHeader>
        <div class="relative h-160 max-h-full w-full">
            <Cropper
                bind:crop
                bind:zoom
                aspect={2}
                image={imageUrl}
                showGrid={false}
                oncropcomplete={handleCrop}
            />
        </div>
        <DialogFooter class="gap-4">
            <DialogClose disabled={isSubmitting}>Отмена</DialogClose>
            <Button onclick={handleClick} disabled={isSubmitting}>Применить</Button>
        </DialogFooter>
    </Content>
</DialogRoot>
