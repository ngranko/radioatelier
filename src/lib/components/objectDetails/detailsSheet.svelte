<script lang="ts">
    import {
        clampSheetHeight,
        getSettledPosition,
        heightForPosition,
        type DragSample,
    } from '$lib/components/objectDetails/sheetSnap';
    import {objectDetailsOverlay, setOverlayPosition} from '$lib/state/objectDetailsOverlay.svelte';
    import {trackViewportMetrics, viewportMetrics} from '$lib/state/viewport.svelte';
    import {cn} from '$lib/utils.ts';
    import {onMount, type Snippet} from 'svelte';

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

    const HEIGHT_TRANSITION_MS = 300;

    let {children, header}: Props = $props();

    let asideElement: HTMLElement | undefined = $state();
    let isDragging = $state(false);
    let dragHeight = $state<number | null>(null);
    let dragStart: {y: number; height: number} | null = null;
    let previousDragSample: DragSample | null = null;
    let currentDragSample: DragSample | null = null;

    const settledHeight = $derived(
        viewportMetrics.height
            ? heightForPosition(objectDetailsOverlay.position, viewportMetrics.height)
            : null,
    );
    const sheetHeight = $derived(dragHeight ?? settledHeight);

    onMount(() => trackViewportMetrics());

    // The shrunken sheet can leave the field the user is typing in below its
    // fold, so it is pulled back into view once the height has settled.
    $effect(() => {
        if (!viewportMetrics.keyboardInset) {
            return;
        }

        const timer = setTimeout(scrollFocusedFieldIntoView, HEIGHT_TRANSITION_MS);
        return () => clearTimeout(timer);
    });

    function scrollFocusedFieldIntoView() {
        const focused = document.activeElement;
        if (!(focused instanceof HTMLElement) || !asideElement?.contains(focused)) {
            return;
        }

        const scroller = findFieldScroller(focused);
        if (!scroller) {
            return;
        }

        const field = focused.getBoundingClientRect();
        const view = scroller.getBoundingClientRect();
        scroller.scrollBy({top: field.top - view.top - (view.height - field.height) / 2});
    }

    // scrollIntoView also scrolls the document, which fights the pan the browser
    // has already applied for the keyboard, so the field is moved inside the
    // scroller it actually lives in instead.
    function findFieldScroller(field: HTMLElement) {
        let node = field.parentElement;
        while (node && node !== asideElement) {
            if (/auto|scroll/.test(getComputedStyle(node).overflowY)) {
                return node;
            }

            node = node.parentElement;
        }

        return null;
    }

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
        if (!dragStart) {
            return;
        }

        const height = clampSheetHeight(
            dragStart.height + (dragStart.y - evt.clientY),
            viewportMetrics.height,
        );
        previousDragSample = currentDragSample;
        currentDragSample = {height, time: performance.now()};
        dragHeight = height;
    }

    function handleDragEnd() {
        if (!dragStart || dragHeight === null) {
            resetDrag();
            return;
        }

        const nearest = getSettledPosition(
            dragHeight,
            viewportMetrics.height,
            previousDragSample,
            currentDragSample,
        );

        resetDrag();
        setOverlayPosition(nearest);
    }

    function resetDrag() {
        dragStart = null;
        dragHeight = null;
        previousDragSample = null;
        currentDragSample = null;
        isDragging = false;
    }
</script>

<aside
    bind:this={asideElement}
    style:height={sheetHeight === null ? undefined : `${sheetHeight}px`}
    style:bottom={`${viewportMetrics.keyboardInset}px`}
    class={cn([
        'bg-background absolute bottom-0 z-3 m-2 flex w-[calc(100dvw-8px*2)] max-w-100 flex-col rounded-2xl transition-[height] ease-out',
        {
            'transition-none': isDragging,
            'overflow-hidden': objectDetailsOverlay.isMinimized,
            // viewport-unaware fallbacks for the server render, replaced by the
            // measured height as soon as the sheet mounts
            'h-14': objectDetailsOverlay.isMinimized,
            'h-[42dvh]': objectDetailsOverlay.position === 'peek',
            'h-[calc(100dvh-8px*2)]': objectDetailsOverlay.position === 'full',
        },
    ])}
>
    {@render header({
        isDragging,
        onDragCancel: resetDrag,
        onDragEnd: handleDragEnd,
        onDragMove: handleDragMove,
        onDragStart: handleDragStart,
    })}
    {@render children()}
</aside>
