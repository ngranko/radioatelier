import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {LatLngLiteral, MapBounds, MapProvider} from '$lib/interfaces/map';
import type {MarkerIcon} from '$lib/interfaces/marker';
import {MarkerManager} from './markerManager';
import type {Marker} from './marker';
import type {MarkerRenderer} from './renderer/markerRenderer';

let frames: FrameRequestCallback[] = [];

function flushAllFrames() {
    while (frames.length > 0) {
        const callbacks = frames;
        frames = [];
        for (const callback of callbacks) {
            callback(0);
        }
    }
}

function makeBounds(): MapBounds {
    return {
        getCenter: () => ({lat: 0, lng: 0}),
        contains: () => true,
        extend: () => {},
    };
}

function makeProvider(): MapProvider {
    return {
        getZoom: () => 10,
        setZoom: () => {},
        getMinZoom: () => 1,
        getMaxZoom: () => 21,
        getCenter: () => ({lat: 0, lng: 0}),
        getBounds: () => makeBounds(),
        setCenter: () => {},
        fitBounds: () => {},
        createBounds: makeBounds,
        setDraggable: () => {},
        onIdle: () => () => {},
        onClick: () => () => {},
        onDragStart: () => () => {},
        onDragEnd: () => () => {},
        onPointerMove: () => () => {},
        createMarkerHandle: () => {
            throw new Error('not implemented');
        },
        preloadMarkerLibrary: () => Promise.resolve(),
        closeStreetView: () => {},
        destroy: () => {},
    };
}

function makeRenderer() {
    const shown: Marker[] = [];
    const renderer: MarkerRenderer = {
        ensureCreated: () => {},
        syncAll: () => {},
        show: marker => void shown.push(marker),
        hide: () => {},
        remove: () => {},
        applyState: () => {},
        destroy: () => {},
    };
    return {renderer, shown};
}

function addListMarkers(manager: MarkerManager, positions: LatLngLiteral[]) {
    const icon = (() => null) as unknown as MarkerIcon;
    positions.forEach((position, index) => {
        manager.addMarker(`marker-${index}`, position, {
            icon,
            color: '#ffffff',
            source: 'list',
        });
    });
}

function updateMarkersInViewport(manager: MarkerManager) {
    (manager as unknown as {updateMarkersInViewport(): void}).updateMarkersInViewport();
}

describe('MarkerManager', () => {
    beforeEach(() => {
        frames = [];
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            frames.push(callback);
            return frames.length;
        });
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('keeps the max visible marker cap for DOM rendering', () => {
        const {renderer, shown} = makeRenderer();
        const manager = new MarkerManager(makeProvider(), () => renderer, {
            renderer: 'dom',
            maxVisibleMarkers: 1,
            chunkSize: 10,
        });

        addListMarkers(manager, [
            {lat: 0, lng: 0},
            {lat: 1, lng: 1},
        ]);
        updateMarkersInViewport(manager);
        flushAllFrames();

        expect(shown).toHaveLength(1);
    });

    it('does not cap in-bounds markers when deck rendering is active', () => {
        const {renderer, shown} = makeRenderer();
        const manager = new MarkerManager(makeProvider(), () => renderer, {
            renderer: 'deck',
            maxVisibleMarkers: 1,
            chunkSize: 10,
        });

        addListMarkers(manager, [
            {lat: 0, lng: 0},
            {lat: 1, lng: 1},
        ]);
        updateMarkersInViewport(manager);
        flushAllFrames();

        expect(shown).toHaveLength(2);
    });
});
