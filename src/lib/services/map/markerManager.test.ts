import type {MapProvider} from '$lib/interfaces/map';
import type {MarkerIcon, MarkerOptions} from '$lib/interfaces/marker';
import type {Marker} from '$lib/services/map/marker';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {MarkerManager} from './markerManager';

const markerOptions: MarkerOptions = {
    icon: (() => {}) as unknown as MarkerIcon,
    color: '#000000',
    source: 'list',
};

function makeProvider(): MapProvider {
    return {
        preloadMarkerLibrary: async () => {},
        getBounds: () => undefined,
    } as unknown as MapProvider;
}

function makeRenderer() {
    let finishRemoval: (() => void) | undefined;
    const renderer: MarkerRenderer = {
        ensureCreated: () => {},
        syncAll: () => {},
        show: () => {},
        hide: () => {},
        remove: (_marker, onRemoved) => {
            finishRemoval = onRemoved;
        },
        applyState: () => {},
        destroy: () => {},
    };
    return {renderer, finishRemoval: () => finishRemoval?.()};
}

describe('MarkerManager', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('allows a marker to be re-added while its old removal animation is pending', () => {
        const {renderer, finishRemoval} = makeRenderer();
        const manager = new MarkerManager(makeProvider(), () => renderer);
        const first = manager.addMarker('marker', {lat: 1, lng: 2}, markerOptions);

        manager.removeMarker('marker', first as Marker);
        const replacement = manager.addMarker('marker', {lat: 1, lng: 2}, markerOptions);
        finishRemoval();

        expect(replacement).not.toBe(first);
        expect(manager.getMarker('marker')).toBe(replacement);
    });
});
