import type {Marker} from '$lib/services/map/marker';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {GpuHybridRenderer} from './gpuHybridRenderer';

describe('GpuHybridRenderer', () => {
    let frames: FrameRequestCallback[] = [];

    // Running frames on request would hide the boundary the retirement relies on.
    function flushFrames(): void {
        const pending = frames;
        frames = [];
        for (const frame of pending) {
            frame(0);
        }
    }

    // The Maps API paints a shown marker a few frames later; the renderer waits for that signal
    // before it drops the sprite, so a double has to deliver it.
    function revealsImmediately() {
        return vi.fn((_marker: Marker, onRevealed?: () => void) => onRevealed?.());
    }

    function createRenderer(parts: Record<string, unknown>): GpuHybridRenderer {
        const renderer = Object.create(GpuHybridRenderer.prototype) as GpuHybridRenderer;
        Object.assign(renderer, {retirements: new Map(), destroyed: false}, parts);
        return renderer;
    }

    beforeEach(() => {
        vi.useFakeTimers();
        frames = [];
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            frames.push(callback);
            return frames.length;
        });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('does not hide the DOM marker while it is promoted', () => {
        const marker = {usesDomRenderer: () => false} as Marker;
        const domHide = vi.fn();
        const gpuHide = vi.fn();
        const renderer = createRenderer({
            dom: {hide: domHide},
            gpu: {hide: gpuHide},
            promoted: marker,
        });

        renderer.hide(marker);
        expect(domHide).not.toHaveBeenCalled();
        expect(gpuHide).not.toHaveBeenCalled();

        Object.assign(renderer, {promoted: undefined});
        renderer.hide(marker);
        expect(gpuHide).toHaveBeenCalledWith(marker);
    });

    it('hands a held sprite to the DOM renderer and takes it back on release', () => {
        const marker = {usesDomRenderer: () => false} as Marker;
        const dom = {
            ensureCreated: vi.fn(),
            reveal: vi.fn((_marker: Marker, onRevealed?: () => void) => onRevealed?.()),
            hide: vi.fn(),
            beginDrag: vi.fn(),
            endDrag: vi.fn(),
        };
        const gpu = {setExcludedMarker: vi.fn()};
        const onInteraction = vi.fn();
        const renderer = createRenderer({dom, gpu, onInteraction});
        const gestures = renderer as unknown as {startDrag(m: Marker): void; endDrag(): void};

        gestures.startDrag(marker);

        expect(gpu.setExcludedMarker).toHaveBeenCalledWith(marker);
        expect(dom.ensureCreated).toHaveBeenCalledWith(marker);
        expect(dom.reveal).toHaveBeenCalledWith(marker, expect.any(Function));
        expect(dom.beginDrag).toHaveBeenCalledWith(marker);

        gestures.endDrag();
        vi.runAllTimers();
        flushFrames();

        expect(dom.endDrag).toHaveBeenCalledWith(marker);
        expect(dom.hide).toHaveBeenCalledWith(marker);
        expect(gpu.setExcludedMarker).toHaveBeenLastCalledWith(undefined);
        // Claims the click Maps fires on release, which would otherwise create an object.
        expect(onInteraction).toHaveBeenCalledOnce();
    });

    it('holds the sprite in place until the DOM twin has actually been painted', () => {
        const marker = {usesDomRenderer: () => false} as Marker;
        let landed: (() => void) | undefined;
        const dom = {
            ensureCreated: vi.fn(),
            reveal: vi.fn((_marker: Marker, onRevealed?: () => void) => {
                landed = onRevealed;
            }),
            hide: vi.fn(),
        };
        const gpu = {setExcludedMarker: vi.fn()};
        const renderer = createRenderer({dom, gpu});

        (renderer as unknown as {promote(m: Marker | undefined): void}).promote(marker);

        // Dropping it here is the frame the map draws with no marker on it at all.
        expect(gpu.setExcludedMarker).not.toHaveBeenCalled();

        landed?.();

        expect(gpu.setExcludedMarker).toHaveBeenCalledWith(marker);
    });

    it('leaves a release that never became a drag to the map click handler', () => {
        const onInteraction = vi.fn();
        const renderer = createRenderer({onInteraction});

        (renderer as unknown as {endDrag(): void}).endDrag();

        expect(onInteraction).not.toHaveBeenCalled();
    });

    it('keeps the sprite hidden until the highlight has scaled back down', () => {
        const marker = {usesDomRenderer: () => false} as Marker;
        const dom = {ensureCreated: vi.fn(), reveal: revealsImmediately(), hide: vi.fn()};
        const gpu = {setExcludedMarker: vi.fn()};
        const renderer = createRenderer({dom, gpu});
        const focus = renderer as unknown as {promote(m: Marker | undefined): void};

        focus.promote(marker);
        expect(dom.reveal).toHaveBeenCalledWith(marker, expect.any(Function));

        focus.promote(undefined);
        // Both markers would be drawn at once, doubling the halo, if the sprite came back now.
        expect(gpu.setExcludedMarker).toHaveBeenLastCalledWith(marker);
        expect(dom.hide).not.toHaveBeenCalled();

        vi.runAllTimers();

        expect(gpu.setExcludedMarker).toHaveBeenLastCalledWith(undefined);
        expect(dom.hide).not.toHaveBeenCalled();

        flushFrames();
        expect(dom.hide).toHaveBeenCalledWith(marker);
    });

    it('retires every marker when focus moves on before the previous swap finished', () => {
        const first = {usesDomRenderer: () => false} as Marker;
        const second = {usesDomRenderer: () => false} as Marker;
        const dom = {ensureCreated: vi.fn(), reveal: revealsImmediately(), hide: vi.fn()};
        const gpu = {setExcludedMarker: vi.fn()};
        const renderer = createRenderer({dom, gpu});
        const focus = renderer as unknown as {promote(m: Marker | undefined): void};

        focus.promote(first);
        focus.promote(second);
        focus.promote(undefined);

        vi.advanceTimersByTime(0);
        flushFrames();
        expect(dom.hide).toHaveBeenCalledWith(first);
        // The second marker is still scaling down, so it keeps holding the exclusion slot.
        expect(gpu.setExcludedMarker).toHaveBeenLastCalledWith(second);

        vi.runAllTimers();
        flushFrames();
        expect(dom.hide).toHaveBeenCalledWith(second);
        expect(gpu.setExcludedMarker).toHaveBeenLastCalledWith(undefined);
    });

    it('drops a retirement whose renderers were destroyed before its frame ran', () => {
        const marker = {usesDomRenderer: () => false} as Marker;
        const dom = {
            ensureCreated: vi.fn(),
            reveal: revealsImmediately(),
            hide: vi.fn(),
            destroy: vi.fn(),
        };
        const gpu = {setExcludedMarker: vi.fn(), destroy: vi.fn()};
        const renderer = createRenderer({
            dom,
            gpu,
            unsubscribeClustering: vi.fn(),
            unsubscribeFocus: vi.fn(),
        });
        const focus = renderer as unknown as {promote(m: Marker | undefined): void};

        focus.promote(marker);
        focus.promote(undefined);
        vi.runAllTimers();

        renderer.destroy();
        flushFrames();

        expect(dom.hide).not.toHaveBeenCalled();
    });
});
