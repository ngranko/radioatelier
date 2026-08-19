import type {MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {markerLifecycle} from '$lib/services/map/markerLifecycle';
import type {DeckOverlayHost} from '$lib/services/map/providers/google/deckOverlayHost';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ClusteredMarkerRenderer} from './clusteredMarkerRenderer';

function marker(lat = 55.75, lng = 37.61): Marker {
    return {
        getPosition: () => ({lat, lng}),
        getState: () => ({isVisited: false, isRemoved: false}),
        options: {color: '#000000', iconKey: 'landmark'},
    } as Marker;
}

function nearbyMarkers(): Marker[] {
    return [marker(55.75, 37.61), marker(55.7501, 37.6101), marker(55.7502, 37.6102)];
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

describe('ClusteredMarkerRenderer', () => {
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
        const provider = {
            getZoom: () => 18,
        } as MapProvider;
        const renderer = new ClusteredMarkerRenderer(provider, overlay, vi.fn());

        renderer.ensureCreated(marker());
        vi.advanceTimersByTime(16);
        frames[0](0);

        expect(setLayers).toHaveBeenCalledOnce();
        const layers = setLayers.mock.calls[0][0];
        expect(layers.map(layer => layer.id)).toEqual([
            'clustered-marker',
            'marker-clusters',
            'marker-cluster-counts',
        ]);
        expect(markerLifecycle.isIdle).toBe(true);
        renderer.destroy();
    });

    it('can disable clustering and show every marker', () => {
        const {frames, setLayers, overlay} = overlayHarness();
        const renderer = new ClusteredMarkerRenderer(
            {getZoom: () => 8} as MapProvider,
            overlay,
            vi.fn(),
        );

        for (const item of nearbyMarkers()) {
            renderer.ensureCreated(item);
        }
        flush(frames);

        expect(layerLength(setLayers, 'marker-clusters')).toBe(1);
        expect(layerLength(setLayers, 'clustered-marker')).toBe(0);

        renderer.setClusteringEnabled(false);
        flush(frames);

        expect(layerLength(setLayers, 'marker-clusters')).toBe(0);
        expect(layerLength(setLayers, 'clustered-marker')).toBe(3);
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
        const provider = {getZoom: () => 18} as MapProvider;
        const renderer = new ClusteredMarkerRenderer(provider, overlay, vi.fn());

        renderer.ensureCreated(marker());
        renderer.destroy();
        vi.runAllTimers();

        expect(setLayers).not.toHaveBeenCalled();
        expect(detach).toHaveBeenCalledOnce();
        expect(markerLifecycle.isIdle).toBe(true);
    });
});
