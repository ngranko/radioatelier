<script lang="ts">
    import type {ObjectImage} from '$lib/interfaces/object';
    import {cn} from '$lib/utils.ts';
    import StarIcon from '@lucide/svelte/icons/star';
    import {tick} from 'svelte';

    interface Props {
        images: ObjectImage[];
        /** The image the carousel is showing. */
        index: number;
        disabled?: boolean;
        onSelect(index: number): void;
    }

    let {images = $bindable(), index, disabled = false, onSelect}: Props = $props();

    let draggedId: string | null = $state(null);

    function place(id: string, target: number) {
        const moved = images.find(image => image.id === id)!;
        const rest = images.filter(image => image !== moved);
        images = rest.toSpliced(Math.max(0, target), 0, moved);
    }

    // The strip takes the capture rather than the thumbnail, because reordering
    // moves the thumbnail in the DOM and a moved node drops its capture.
    function handlePress(event: PointerEvent) {
        const thumbnail = (event.target as HTMLElement).closest<HTMLElement>('[data-image-id]');
        if (!thumbnail || disabled || event.button !== 0) {
            return;
        }

        (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
        draggedId = thumbnail.dataset.imageId!;
    }

    function handleMove(event: PointerEvent) {
        const over = document
            .elementFromPoint(event.clientX, event.clientY)
            ?.closest<HTMLElement>('[data-image-id]');
        const target = images.findIndex(image => image.id === over?.dataset.imageId);

        if (draggedId && target >= 0 && images[target].id !== draggedId) {
            place(draggedId, target);
        }
    }

    function handleLift() {
        if (draggedId) {
            onSelect(images.findIndex(image => image.id === draggedId));
        }
        draggedId = null;
    }

    async function handleKeydown(event: KeyboardEvent, position: number) {
        const step = {ArrowLeft: -1, ArrowRight: 1}[event.key];
        if (!step || disabled) {
            return;
        }

        event.preventDefault();
        const thumbnail = event.currentTarget as HTMLElement;
        place(images[position].id, position + step);
        await tick();
        thumbnail.focus();
        onSelect(Math.min(Math.max(0, position + step), images.length - 1));
    }
</script>

<div
    class="mt-2 flex flex-wrap gap-2"
    role="group"
    aria-label="Порядок фото: перетащите или сдвиньте стрелками, первое фото — обложка"
    onpointerdown={handlePress}
    onpointermove={handleMove}
    onpointerup={handleLift}
    onpointercancel={handleLift}
>
    {#each images as image, position (image.id)}
        <button
            type="button"
            data-image-id={image.id}
            class={cn(
                'bg-muted relative size-12 cursor-grab touch-none overflow-hidden rounded-md border transition-[opacity,box-shadow] select-none',
                position === index && 'ring-primary ring-2',
                image.id === draggedId && 'cursor-grabbing opacity-60',
            )}
            onclick={() => onSelect(position)}
            onkeydown={event => handleKeydown(event, position)}
            aria-label="Фото {position + 1} из {images.length}"
            aria-current={position === index}
        >
            <img
                class="h-full w-full object-cover"
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
