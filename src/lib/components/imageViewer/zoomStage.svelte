<script lang="ts">
    import {ZoomGestures, type DragHandlers} from '$lib/components/imageViewer/zoomGestures';
    import {
        FIT_VIEW,
        clampView,
        panBy,
        resolveMaxScale,
        zoomAround,
        type Frame,
        type Point,
        type View,
    } from '$lib/components/imageViewer/zoomPan';
    import ZoomToolbar from '$lib/components/imageViewer/zoomToolbar.svelte';
    import Spinner from '$lib/components/spinner.svelte';
    import {cn} from '$lib/utils.ts';

    interface Props {
        url: string;
        isActive: boolean;
        /** Where the swipe track has moved this photo to; the zoom toolbar stays put. */
        shift: Point;
        dragHandlers: DragHandlers;
        onClose(): void;
        onSwitchImage(direction: number): void;
    }

    let {url, isActive, shift, dragHandlers, onClose, onSwitchImage}: Props = $props();

    const ZOOM_STEP = 1.5;
    const PAN_STEP = 80;
    const STAGE_CENTRE: Point = {x: 0, y: 0};

    let stage: HTMLElement | undefined = $state();
    let image: HTMLImageElement | undefined = $state();
    let frame: Frame | null = $state.raw(null);
    let view = $state.raw(FIT_VIEW);
    let isAnimated = $state(false);
    let hasFailed = $state(false);

    let isReady = $derived(frame !== null);

    const gestures = new ZoomGestures({
        getView: () => view,
        getFrame: () => frame!,
        show,
        drag: travel => dragHandlers.drag(travel),
        release: (travel, velocity) => dragHandlers.release(travel, velocity),
        cancel: () => dragHandlers.cancel(),
        tap: closeOnOutsideTap,
    });

    // a photo swiped away should be back at its fitted size when swiped back to
    $effect(() => {
        if (!isActive) {
            show(FIT_VIEW, true);
        }
    });

    const keyActions: Record<string, () => void> = {
        '+': () => zoomBy(ZOOM_STEP),
        '=': () => zoomBy(ZOOM_STEP),
        '-': () => zoomBy(1 / ZOOM_STEP),
        '0': () => show(FIT_VIEW, true),
        ArrowLeft: () => (view.scale > 1 ? nudge({x: PAN_STEP, y: 0}) : onSwitchImage(-1)),
        ArrowRight: () => (view.scale > 1 ? nudge({x: -PAN_STEP, y: 0}) : onSwitchImage(1)),
        ArrowUp: () => nudge({x: 0, y: PAN_STEP}),
        ArrowDown: () => nudge({x: 0, y: -PAN_STEP}),
    };

    function measureFrame() {
        // resize calls this too, so it must not mark a loading or broken image as ready
        if (!stage || !image?.complete || !image.naturalWidth) {
            return;
        }

        frame = {
            stage: {width: stage.clientWidth, height: stage.clientHeight},
            image: {width: image.offsetWidth, height: image.offsetHeight},
            maxScale: resolveMaxScale(image.naturalWidth, image.offsetWidth),
        };
        view = clampView(view, frame);
    }

    function show(next: View, animate = false) {
        isAnimated = animate;
        view = next;
    }

    function zoomBy(factor: number) {
        if (frame) {
            show(zoomAround(view, view.scale * factor, STAGE_CENTRE, frame), true);
        }
    }

    function nudge(delta: Point) {
        if (frame) {
            show(panBy(view, delta, frame), true);
        }
    }

    function closeOnOutsideTap(point: Point) {
        const rect = image!.getBoundingClientRect();
        const isOnImage =
            point.x >= rect.left &&
            point.x <= rect.right &&
            point.y >= rect.top &&
            point.y <= rect.bottom;

        if (!isOnImage) {
            onClose();
        }
    }

    function handleKeydown(event: KeyboardEvent) {
        // leaves the browser's own ⌘+/⌘− page zoom and Alt+← / Alt+→ history navigation alone
        const action =
            isActive && !event.metaKey && !event.ctrlKey && !event.altKey && keyActions[event.key];
        if (action) {
            event.preventDefault();
            action();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} onresize={measureFrame} />

<!-- a backdrop tap is a pointer shortcut; keyboard users close with Escape or the close button -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
    bind:this={stage}
    class="absolute inset-0 flex touch-none items-center justify-center overflow-hidden select-none"
    style:transform="translate({shift.x}px, {shift.y}px)"
    {@attach isReady && gestures.attach}
    onclick={isReady ? undefined : onClose}
>
    <img
        bind:this={image}
        class={cn(
            'max-h-full max-w-full motion-reduce:transition-none',
            isAnimated && 'transition-transform duration-200 ease-out',
            !isReady && 'opacity-0',
            view.scale > 1 ? 'cursor-grab' : 'cursor-zoom-in',
        )}
        style:transform="translate({view.x}px, {view.y}px) scale({view.scale})"
        src={url}
        alt="Изображение"
        draggable="false"
        onload={measureFrame}
        onerror={() => (hasFailed = true)}
    />
    {#if hasFailed}
        <p class="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-white/70">
            Не удалось загрузить изображение
        </p>
    {:else if !frame}
        <Spinner class="absolute inset-0 m-auto size-6 text-white/70" />
    {/if}
</div>

{#if frame && isActive}
    <ZoomToolbar
        scale={view.scale}
        maxScale={frame.maxScale}
        onZoomIn={() => zoomBy(ZOOM_STEP)}
        onZoomOut={() => zoomBy(1 / ZOOM_STEP)}
        onReset={() => show(FIT_VIEW, true)}
    />
{/if}
