<script lang="ts">
    import type {Snippet} from 'svelte';
    import {
        objectDetailsOverlay,
        setOverlayPosition,
    } from '$lib/state/objectDetailsOverlay.svelte';
    import {cn} from '$lib/utils.ts';
    import {
        clampSheetHeight,
        getSettledPosition,
        type DragSample,
    } from '$lib/components/objectDetails/sheetSnap';

    interface HeaderState {
        isDragging: boolean;
        onDragCancel(): void;
        onDragEnd(): void;
        onDragMove(evt: PointerEvent): void;
        onDragStart(evt: PointerEvent): void;
    }

    interface Props {
        children: Snippet;
        header: Snippet<[HeaderState]>;
    }

    let {children, header}: Props = $props();

    let asideElement: HTMLElement | undefined = $state();
    let isDragging = $state(false);
    let dragStart: {y: number; height: number} | null = null;
    let previousDragSample: DragSample | null = null;
    let currentDragSample: DragSample | null = null;

    function handleDragStart(evt: PointerEvent) {
        if (!asideElement || (evt.target as HTMLElement).closest('button')) {
            return;
        }

        dragStart = {y: evt.clientY, height: asideElement.offsetHeight};
        previousDragSample = null;
        currentDragSample = {height: dragStart.height, time: performance.now()};
        isDragging = true;
        (evt.currentTarget as HTMLElement).setPointerCapture(evt.pointerId);
    }

    function handleDragMove(evt: PointerEvent) {
        if (!dragStart || !asideElement) {
            return;
        }

        const height = clampSheetHeight(dragStart.height + (dragStart.y - evt.clientY), window.innerHeight);
        previousDragSample = currentDragSample;
        currentDragSample = {height, time: performance.now()};
        asideElement.style.height = `${height}px`;
    }

    function handleDragEnd() {
        if (!dragStart || !asideElement) {
            return;
        }

        const height = asideElement.offsetHeight;
        const nearest = getSettledPosition(
            height,
            window.innerHeight,
            previousDragSample,
            currentDragSample,
        );

        asideElement.style.height = '';
        dragStart = null;
        previousDragSample = null;
        currentDragSample = null;
        isDragging = false;
        setOverlayPosition(nearest);
    }
</script>

<aside
    bind:this={asideElement}
    class={cn([
        'bg-background absolute bottom-0 z-3 m-2 flex w-[calc(100dvw-8px*2)] max-w-100 flex-col rounded-2xl transition-[height] ease-out',
        {
            'transition-none': isDragging,
            'h-14 overflow-hidden': objectDetailsOverlay.isMinimized,
            'h-[42dvh]': objectDetailsOverlay.position === 'peek',
            'h-[calc(100dvh-8px*2)]': objectDetailsOverlay.position === 'full',
        },
    ])}
>
    {@render header({
        isDragging,
        onDragCancel: handleDragEnd,
        onDragEnd: handleDragEnd,
        onDragMove: handleDragMove,
        onDragStart: handleDragStart,
    })}
    {@render children()}
</aside>
