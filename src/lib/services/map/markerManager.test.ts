import type {MapProvider} from '$lib/interfaces/map';
import type {MarkerIcon, MarkerOptions} from '$lib/interfaces/marker';
import type {Marker} from '$lib/services/map/marker';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {MarkerManager, type RendererMode} from './markerManager';

const markerOptions: MarkerOptions = {
    icon: (() => {}) as unknown as MarkerIcon,
    color: '#000000',
    source: 'list',
};

function makeProvider(zoom = 15) {
    const provider = {
        preloadMarkerLibrary: async () => {},
        getBounds: () => undefined,
        getZoom: vi.fn(() => zoom),
    };
    return {provider: provider as unknown as MapProvider, getZoom: provider.getZoom};
}

function makeRenderer() {
    const removed: Marker[] = [];
    const renderer: MarkerRenderer = {
        ensureCreated: () => {},
        syncAll: vi.fn(),
        show: () => {},
        hide: () => {},
        remove: marker => void removed.push(marker),
        applyState: () => {},
        destroy: vi.fn(),
    };
    return {renderer, removed};
}

function makeRendererFactory() {
    const created: {mode: RendererMode; renderer: MarkerRenderer}[] = [];
    const factory = (mode: RendererMode) => {
        const {renderer} = makeRenderer();
        created.push({mode, renderer});
        return renderer;
    };
    return {factory, created};
}

describe('MarkerManager', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('removes the marker instance before allowing the id to be re-added', () => {
        const {renderer, removed} = makeRenderer();
        const manager = new MarkerManager(makeProvider().provider, () => renderer);
        const first = manager.addMarker('marker', {lat: 1, lng: 2}, markerOptions);

        manager.removeMarker('marker', first as Marker);
        expect(manager.getMarker('marker')).toBeUndefined();
        expect(removed).toEqual([first]);

        const replacement = manager.addMarker('marker', {lat: 1, lng: 2}, markerOptions);

        expect(replacement).not.toBe(first);
        expect(manager.getMarker('marker')).toBe(replacement);
    });

    it('picks the initial renderer from the current zoom', () => {
        const {factory, created} = makeRendererFactory();

        const zoomedOut = new MarkerManager(makeProvider(8).provider, factory, {
            deckZoomThreshold: 10,
        });
        expect(zoomedOut.isDeckRenderer).toBe(true);
        expect(created[0].mode).toBe('deck');

        const zoomedIn = new MarkerManager(makeProvider(15).provider, factory, {
            deckZoomThreshold: 10,
        });
        expect(zoomedIn.isDeckRenderer).toBe(false);
        expect(created[1].mode).toBe('dom');
    });

    it('switches renderers when the zoom crosses the threshold', () => {
        const {provider, getZoom} = makeProvider(15);
        const {factory, created} = makeRendererFactory();
        const manager = new MarkerManager(provider, factory, {deckZoomThreshold: 10});
        const marker = manager.addMarker('marker', {lat: 1, lng: 2}, markerOptions);

        getZoom.mockReturnValue(8);
        manager.syncRendererWithViewport();

        expect(manager.isDeckRenderer).toBe(true);
        expect(created).toHaveLength(2);
        expect(created[1].mode).toBe('deck');
        expect(created[0].renderer.destroy).toHaveBeenCalled();
        const syncedMarkers = [...vi.mocked(created[1].renderer.syncAll).mock.calls[0][0]];
        expect(syncedMarkers).toEqual([marker]);
    });

    it('keeps the current renderer while the zoom stays on one side', () => {
        const {provider} = makeProvider(15);
        const {factory, created} = makeRendererFactory();
        const manager = new MarkerManager(provider, factory, {deckZoomThreshold: 10});

        manager.syncRendererWithViewport();
        manager.syncRendererWithViewport();

        expect(manager.isDeckRenderer).toBe(false);
        expect(created).toHaveLength(1);
        expect(created[0].renderer.destroy).not.toHaveBeenCalled();
    });

    it('switches back when the zoom returns across the threshold', () => {
        const {provider, getZoom} = makeProvider(8);
        const {factory, created} = makeRendererFactory();
        const manager = new MarkerManager(provider, factory, {deckZoomThreshold: 10});

        getZoom.mockReturnValue(15);
        manager.syncRendererWithViewport();
        getZoom.mockReturnValue(8);
        manager.syncRendererWithViewport();

        expect(manager.isDeckRenderer).toBe(true);
        expect(created.map(item => item.mode)).toEqual(['deck', 'dom', 'deck']);
    });
});
