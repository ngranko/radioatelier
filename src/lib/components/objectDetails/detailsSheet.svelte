<script lang="ts">
    import type {Snippet} from 'svelte';
    import {
        objectDetailsOverlay,
        setOverlayPosition,
        type ObjectDetailsOverlayPosition,
    } from '$lib/state/objectDetailsOverlay.svelte';
    import {cn} from '$lib/utils.ts';

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

    const MINIMIZED_HEIGHT = 56;
    const SHEET_MARGIN = 16;

    function heightForPosition(position: ObjectDetailsOverlayPosition) {
        switch (position) {
            case 'minimized':
                return MINIMIZED_HEIGHT;
            case 'peek':
                return Math.round(window.innerHeight * 0.42);
            default:
                return window.innerHeight - SHEET_MARGIN;
        }
    }

    function handleDragStart(evt: PointerEvent) {
        if (!asideElement || (evt.target as HTMLElement).closest('button')) {
            return;
        }

        dragStart = {y: evt.clientY, height: asideElement.offsetHeight};
        isDragging = true;
        (evt.currentTarget as HTMLElement).setPointerCapture(evt.pointerId);
    }

    function handleDragMove(evt: PointerEvent) {
        if (!dragStart || !asideElement) {
            return;
        }

        const height = Math.min(
            Math.max(dragStart.height + (dragStart.y - evt.clientY), MINIMIZED_HEIGHT),
            window.innerHeight - SHEET_MARGIN,
        );
        asideElement.style.height = `${height}px`;
    }

    function handleDragEnd() {
        if (!dragStart || !asideElement) {
            return;
        }

        const height = asideElement.offsetHeight;
        const positions: ObjectDetailsOverlayPosition[] = ['minimized', 'peek', 'full'];
        const nearest = positions.reduce((best, position) =>
            Math.abs(heightForPosition(position) - height) <
            Math.abs(heightForPosition(best) - height)
                ? position
                : best,
        );

        asideElement.style.height = '';
        dragStart = null;
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
