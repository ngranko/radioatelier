import type {MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {markerLifecycle} from '$lib/services/map/markerLifecycle';
import type {DeckOverlayHost} from '$lib/services/map/providers/google/deckOverlayHost';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {ClusteredMarkerRenderer} from './clusteredMarkerRenderer';

function marker(): Marker {
    return {
        getPosition: () => ({lat: 55.75, lng: 37.61}),
        getState: () => ({isVisited: false, isRemoved: false}),
        options: {color: '#000000', iconKey: 'landmark'},
    } as Marker;
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
            'clustered-marker-halo',
            'clustered-marker-disk',
            'clustered-marker-icon',
            'marker-clusters',
            'marker-cluster-counts',
        ]);
        expect(markerLifecycle.isIdle).toBe(true);
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
