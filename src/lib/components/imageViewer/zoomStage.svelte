<script lang="ts">
    import {ZoomGestures} from '$lib/components/imageViewer/zoomGestures';
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
        onClose(): void;
    }

    let {url, onClose}: Props = $props();

    const ZOOM_STEP = 1.5;
    const PAN_STEP = 80;
    const DISMISS_PULL = 120;
    const BACKDROP_ALPHA = 0.9;
    const STAGE_CENTRE: Point = {x: 0, y: 0};

    let stage: HTMLElement | undefined = $state();
    let image: HTMLImageElement | undefined = $state();
    let frame: Frame | null = $state.raw(null);
    let view = $state.raw(FIT_VIEW);
    let pull = $state(0);
    let isAnimated = $state(false);
    let hasFailed = $state(false);

    let isReady = $derived(frame !== null);
    let backdropAlpha = $derived(
        BACKDROP_ALPHA * (1 - Math.min(Math.abs(pull) / (DISMISS_PULL * 3), 0.6)),
    );

    const gestures = new ZoomGestures({
        getView: () => view,
        getFrame: () => frame!,
        show,
        pull: offset => {
            isAnimated = false;
            pull = offset;
        },
        release: settlePull,
        tap: closeOnOutsideTap,
    });

    const keyActions: Record<string, () => void> = {
        '+': () => zoomBy(ZOOM_STEP),
        '=': () => zoomBy(ZOOM_STEP),
        '-': () => zoomBy(1 / ZOOM_STEP),
        '0': () => show(FIT_VIEW, true),
        ArrowLeft: () => nudge({x: PAN_STEP, y: 0}),
        ArrowRight: () => nudge({x: -PAN_STEP, y: 0}),
        ArrowUp: () => nudge({x: 0, y: PAN_STEP}),
        ArrowDown: () => nudge({x: 0, y: -PAN_STEP}),
    };

    function measureFrame() {
        if (!stage || !image) {
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

    function settlePull() {
        if (Math.abs(pull) > DISMISS_PULL) {
            onClose();
            return;
        }

        isAnimated = true;
        pull = 0;
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
        // leaves the browser's own ⌘+/⌘− page zoom alone
        const action = !event.metaKey && !event.ctrlKey && keyActions[event.key];
        if (action) {
            event.preventDefault();
            action();
        }
    }
</script>

<svelte:window onkeydown={handleKeydown} onresize={measureFrame} />

<div
    bind:this={stage}
    class="absolute inset-0 flex touch-none items-center justify-center overflow-hidden select-none"
    style:background-color="rgb(0 0 0 / {backdropAlpha})"
    {@attach isReady && gestures.attach}
>
    <img
        bind:this={image}
        class={cn(
            'max-h-full max-w-full motion-reduce:transition-none',
            isAnimated && 'transition-transform duration-200 ease-out',
            !isReady && 'opacity-0',
            view.scale > 1 ? 'cursor-grab' : 'cursor-zoom-in',
        )}
        style:transform="translate({view.x}px, {view.y + pull}px) scale({view.scale})"
        src={url}
        alt="Изображение"
        draggable="false"
        onload={measureFrame}
        onerror={() => (hasFailed = true)}
    />
</div>

{#if frame}
    <ZoomToolbar
        scale={view.scale}
        maxScale={frame.maxScale}
        onZoomIn={() => zoomBy(ZOOM_STEP)}
        onZoomOut={() => zoomBy(1 / ZOOM_STEP)}
        onReset={() => show(FIT_VIEW, true)}
    />
{:else if hasFailed}
    <p class="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-sm text-white/70">
        Не удалось загрузить изображение
    </p>
{:else}
    <Spinner class="absolute inset-0 m-auto size-6 text-white/70" />
{/if}
