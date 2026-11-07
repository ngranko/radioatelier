<script lang="ts">
    import type {ObjectImage} from '$lib/interfaces/object';
    import {cn} from '$lib/utils.ts';
    import StarIcon from '@lucide/svelte/icons/star';
    import {tick} from 'svelte';

    interface Props {
        images: ObjectImage[];
        /** The image the carousel is showing. */
        currentIndex: number;
        disabled?: boolean;
        onShowImage(position: number): void;
    }

    let {images = $bindable(), currentIndex, disabled = false, onShowImage}: Props = $props();

    const ARROW_STEPS: Partial<Record<string, number>> = {ArrowLeft: -1, ArrowRight: 1};

    let draggedId: string | null = $state(null);

    function moveImage(imageId: string, toPosition: number) {
        const moved = images.find(image => image.id === imageId)!;
        const rest = images.filter(image => image !== moved);
        images = rest.toSpliced(Math.max(0, toPosition), 0, moved);
    }

    // Capture the pointer on the strip, not on the pressed thumbnail: reordering
    // re-inserts the thumbnail into the DOM, and the browser releases capture
    // from a removed node, which would end the drag after the first swap.
    function handlePress(event: PointerEvent) {
        const thumbnail = (event.target as HTMLElement).closest<HTMLElement>('[data-image-id]');
        if (!thumbnail || disabled || event.button !== 0) {
            return;
        }

        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        draggedId = thumbnail.dataset.imageId!;
    }

    function handleMove(event: PointerEvent) {
        const hoveredThumbnail = document
            .elementFromPoint(event.clientX, event.clientY)
            ?.closest<HTMLElement>('[data-image-id]');
        const hoveredPosition = images.findIndex(
            image => image.id === hoveredThumbnail?.dataset.imageId,
        );

        if (draggedId && hoveredPosition >= 0 && images[hoveredPosition].id !== draggedId) {
            moveImage(draggedId, hoveredPosition);
        }
    }

    function handleDragEnd() {
        if (draggedId) {
            onShowImage(images.findIndex(image => image.id === draggedId));
        }
        draggedId = null;
    }

    async function handleKeydown(event: KeyboardEvent, position: number) {
        const step = ARROW_STEPS[event.key];
        if (!step || disabled) {
            return;
        }

        event.preventDefault();
        const thumbnail = event.currentTarget as HTMLElement;
        moveImage(images[position].id, position + step);
        await tick();
        thumbnail.focus();
        onShowImage(Math.min(Math.max(0, position + step), images.length - 1));
    }
</script>

<div
    class="mt-2 flex flex-wrap gap-2"
    role="group"
    aria-label="Порядок фото: перетащите или сдвиньте стрелками, первое фото — обложка"
    onpointerdown={handlePress}
    onpointermove={handleMove}
    onpointerup={handleDragEnd}
    onpointercancel={handleDragEnd}
>
    {#each images as image, position (image.id)}
        <button
            type="button"
            data-image-id={image.id}
            class={cn(
                'bg-muted relative size-12 cursor-grab touch-none overflow-hidden rounded-md border transition-[opacity,box-shadow] select-none',
                position === currentIndex && 'ring-primary ring-2',
                image.id === draggedId && 'cursor-grabbing opacity-60',
            )}
            onclick={() => onShowImage(position)}
            onkeydown={event => handleKeydown(event, position)}
            aria-label="Фото {position + 1} из {images.length}"
            aria-current={position === currentIndex}
        >
            <img
                class="size-full object-cover"
                src={image.previewUrl || image.url}
                alt=""
                draggable="false"
            />
            {#if position === 0}
                <StarIcon
                    class="absolute top-0.5 left-0.5 size-3.5 fill-current text-white drop-shadow-[0_0_2px_rgb(0_0_0/0.8)]"
                />
            {/if}
        </button>
    {/each}
</div>
