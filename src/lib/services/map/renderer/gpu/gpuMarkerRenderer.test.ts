import type {Marker} from '$lib/services/map/marker';
import {markerLifecycle} from '$lib/services/map/markerLifecycle';
import type {DeckOverlayHost} from '$lib/services/map/providers/google/deckOverlayHost';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {GpuMarkerRenderer} from './gpuMarkerRenderer';
import { SPRITE_POP_OUT_MS } from './spritePopExtension';

function marker(lat = 55.75, lng = 37.61): Marker {
    return {
        getPosition: () => ({lat, lng}),
        getState: () => ({isVisited: false, isRemoved: false}),
        options: {color: '#000000', iconKey: 'landmark'},
    } as Marker;
}

function layerLength(setLayers: {mock: {calls: unknown[][]}}, id: string): number {
    const layers = setLayers.mock.calls.at(-1)?.[0] as
        | {id: string; props: {data: unknown[]}}[]
        | undefined;
    return layers?.find(layer => layer.id === id)?.props.data.length ?? 0;
}

function overlayHarness() {
    const frames: FrameRequestCallback[] = [];
    const setLayers = vi.fn<DeckOverlayHost['setLayers']>();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        frames.push(callback);
        return frames.length;
    });
    return {
        frames,
        setLayers,
        overlay: {
            attach: vi.fn(),
            detach: vi.fn(),
            setLayers,
        } as unknown as DeckOverlayHost,
    };
}

function flush(frames: FrameRequestCallback[]) {
    vi.advanceTimersByTime(16);
    frames.at(-1)?.(0);
}

describe('GpuMarkerRenderer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        markerLifecycle.reset();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        markerLifecycle.reset();
    });

    it('renders the catalog as one set of GPU layers', () => {
        const frames: FrameRequestCallback[] = [];
        const setLayers = vi.fn<DeckOverlayHost['setLayers']>();
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            frames.push(callback);
            return frames.length;
        });
        const overlay = {
            attach: vi.fn(),
            detach: vi.fn(),
            setLayers,
        } as unknown as DeckOverlayHost;
        const renderer = new GpuMarkerRenderer(overlay, vi.fn());

        renderer.ensureCreated(marker());
        vi.advanceTimersByTime(16);
        frames[0](0);

        expect(setLayers).toHaveBeenCalledOnce();
        const layers = setLayers.mock.calls[0][0];
        expect(layers.map(layer => layer.id)).toEqual([
            'gpu-marker',
            'gpu-marker-exit',
            'gpu-marker-fade',
        ]);
        expect(markerLifecycle.isIdle).toBe(true);
        renderer.destroy();
    });

    it('crossfades a marker whose sprite changed, then drops the outgoing sprite', () => {
        const {frames, setLayers, overlay} = overlayHarness();
        const state = {isVisited: false, isRemoved: false};
        const visitable = {
            getPosition: () => ({lat: 55.75, lng: 37.61}),
            getState: () => ({...state}),
            options: {color: '#000000', iconKey: 'landmark'},
        } as Marker;
        const renderer = new GpuMarkerRenderer(overlay, vi.fn());
        renderer.ensureCreated(visitable);
        flush(frames);

        state.isVisited = true;
        renderer.applyState(visitable);
        flush(frames);
        expect(layerLength(setLayers, 'gpu-marker-fade')).toBe(1);

        flush(frames);
        vi.advanceTimersByTime(160);
        flush(frames);

        expect(layerLength(setLayers, 'gpu-marker-fade')).toBe(0);
        expect(markerLifecycle.isIdle).toBe(true);
        renderer.destroy();
    });

    it('shrinks a removed marker away before dropping its sprite', () => {
        const {frames, setLayers, overlay} = overlayHarness();
        const renderer = new GpuMarkerRenderer(overlay, vi.fn());
        const doomed = marker();
        renderer.ensureCreated(doomed);
        flush(frames);

        renderer.remove(doomed);
        flush(frames);

        expect(layerLength(setLayers, 'gpu-marker')).toBe(0);
        expect(layerLength(setLayers, 'gpu-marker-exit')).toBe(1);

        vi.advanceTimersByTime(SPRITE_POP_OUT_MS);
        flush(frames);

        expect(layerLength(setLayers, 'gpu-marker-exit')).toBe(0);
        expect(markerLifecycle.isIdle).toBe(true);
        renderer.destroy();
    });

    it('leaves the exit to the DOM twin when the marker was promoted', () => {
        const {frames, setLayers, overlay} = overlayHarness();
        const renderer = new GpuMarkerRenderer(overlay, vi.fn());
        const promoted = marker();
        renderer.ensureCreated(promoted);
        renderer.setExcludedMarker(promoted);
        flush(frames);

        renderer.remove(promoted);
        flush(frames);

        expect(layerLength(setLayers, 'gpu-marker-exit')).toBe(0);
        renderer.destroy();
    });

    it('cancels a queued render when destroyed', () => {
        const detach = vi.fn();
        const setLayers = vi.fn<DeckOverlayHost['setLayers']>();
        const overlay = {
            attach: vi.fn(),
            detach,
            setLayers,
        } as unknown as DeckOverlayHost;
        const renderer = new GpuMarkerRenderer(overlay, vi.fn());

        renderer.ensureCreated(marker());
        renderer.destroy();
        vi.runAllTimers();

        expect(setLayers).not.toHaveBeenCalled();
        expect(detach).toHaveBeenCalledOnce();
        expect(markerLifecycle.isIdle).toBe(true);
    });
});
