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
    const ensureCreated = vi.fn();
    const show = vi.fn();
    const renderer: MarkerRenderer = {
        setMode: vi.fn(),
        ensureCreated,
        syncAll: vi.fn(),
        show,
        hide: vi.fn(),
        remove: marker => void removed.push(marker),
        applyState: vi.fn(),
        destroy: vi.fn(),
    };
    return {renderer, removed, ensureCreated, show};
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

    it('switches deck mode on the same renderer when the zoom crosses the threshold', () => {
        const {provider, getZoom} = makeProvider(15);
        const {factory, created} = makeRendererFactory();
        const manager = new MarkerManager(provider, factory, {deckZoomThreshold: 10});
        const marker = manager.addMarker('marker', {lat: 1, lng: 2}, markerOptions);

        getZoom.mockReturnValue(8);
        manager.syncRendererWithViewport();

        expect(manager.isDeckRenderer).toBe(true);
        expect(created).toHaveLength(1);
        expect(vi.mocked(created[0].renderer.setMode)).toHaveBeenCalledWith('deck');
        expect(vi.mocked(created[0].renderer.destroy)).not.toHaveBeenCalled();
        const syncedMarkers = [...vi.mocked(created[0].renderer.syncAll).mock.calls[0][0]];
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
        expect(created).toHaveLength(1);
        expect(vi.mocked(created[0].renderer.setMode).mock.calls.map(([mode]) => mode)).toEqual([
            'dom',
            'deck',
        ]);
    });

    it('keeps non-viewport-managed markers visible across a renderer switch', () => {
        const {provider, getZoom} = makeProvider(15);
        const {factory, created} = makeRendererFactory();
        const manager = new MarkerManager(provider, factory, {deckZoomThreshold: 10});
        const shareOptions: MarkerOptions = {...markerOptions, source: 'share'};
        manager.addMarker('share-1', {lat: 1, lng: 2}, shareOptions);
        const list = manager.addMarker('list-1', {lat: 1, lng: 2}, markerOptions);

        // Seed the visible set as a prior viewport pass would have.
        const engine = (manager as unknown as {visibilityEngine: {show: (id: string) => void}})
            .visibilityEngine;
        engine.show('share-1');
        engine.show('list-1');

        const firstHide = vi.fn();
        created[0].renderer.hide = firstHide;

        getZoom.mockReturnValue(8);
        manager.syncRendererWithViewport();

        expect(firstHide.mock.calls.map(([marker]) => marker)).toEqual([list]);
    });

    it('defers DOM creation for list markers until a viewport pass', () => {
        const {renderer, ensureCreated, show} = makeRenderer();
        const manager = new MarkerManager(makeProvider(15).provider, () => renderer, {
            deckZoomThreshold: 10,
        });

        manager.addMarker('list-1', {lat: 1, lng: 2}, markerOptions);

        expect(ensureCreated).not.toHaveBeenCalled();
        expect(show).not.toHaveBeenCalled();
    });

    it('adds list markers to the deck layer immediately', () => {
        const {renderer, ensureCreated, show} = makeRenderer();
        const manager = new MarkerManager(makeProvider(8).provider, () => renderer, {
            deckZoomThreshold: 10,
        });

        const marker = manager.addMarker('list-1', {lat: 1, lng: 2}, markerOptions);

        expect(ensureCreated).toHaveBeenCalledOnce();
        expect(ensureCreated).toHaveBeenCalledWith(marker);
        expect(show).not.toHaveBeenCalled();
    });

    it('creates search markers once and waits for the viewport to show them', () => {
        const {renderer, ensureCreated, show} = makeRenderer();
        const manager = new MarkerManager(makeProvider(8).provider, () => renderer, {
            deckZoomThreshold: 10,
        });
        const searchOptions: MarkerOptions = {...markerOptions, source: 'search'};

        const marker = manager.addMarker('search-1', {lat: 1, lng: 2}, searchOptions);

        expect(ensureCreated).toHaveBeenCalledOnce();
        expect(ensureCreated).toHaveBeenCalledWith(marker);
        expect(show).not.toHaveBeenCalled();
    });

    it('shows share markers as soon as they are added', () => {
        const {renderer, ensureCreated, show} = makeRenderer();
        const manager = new MarkerManager(makeProvider(15).provider, () => renderer, {
            deckZoomThreshold: 10,
        });
        const shareOptions: MarkerOptions = {...markerOptions, source: 'share'};

        const marker = manager.addMarker('share-1', {lat: 1, lng: 2}, shareOptions);

        expect(ensureCreated).toHaveBeenCalledOnce();
        expect(ensureCreated).toHaveBeenCalledWith(marker);
        expect(show).toHaveBeenCalledOnce();
        expect(show).toHaveBeenCalledWith(marker);
    });
});
