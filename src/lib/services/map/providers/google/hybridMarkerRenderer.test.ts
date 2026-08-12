import type {MarkerHandle} from '$lib/interfaces/map';
import type {MarkerIcon} from '$lib/interfaces/marker';
import {Marker} from '$lib/services/map/marker';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

vi.mock('@deck.gl/layers', () => ({
    ScatterplotLayer: class {},
}));

import {HybridMarkerRenderer} from './hybridMarkerRenderer';

const icon = (() => {}) as unknown as MarkerIcon;

function makeOverlay() {
    return {
        attach: vi.fn(),
        detach: vi.fn(),
        setLayers: vi.fn(),
    };
}

function makeHandle(isConnected = false) {
    const classList = {add: vi.fn(), remove: vi.fn()};
    const remove = vi.fn();
    const handle = {
        setPosition: vi.fn(),
        getPosition: () => ({lat: 0, lng: 0}),
        show: vi.fn(),
        hide: vi.fn(),
        remove,
        getElement: () => ({classList, isConnected}) as unknown as HTMLElement,
        addClickListener: () => () => {},
    } as unknown as MarkerHandle;
    return {handle, remove, classList};
}

describe('HybridMarkerRenderer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            callback(0);
            return 0;
        });
        vi.stubGlobal('cancelAnimationFrame', () => {});
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        vi.useRealTimers();
    });

    it('attaches the deck overlay only while in deck mode', () => {
        const overlay = makeOverlay();
        const renderer = new HybridMarkerRenderer({getDeckOverlay: () => overlay} as never, 'dom');

        expect(overlay.attach).not.toHaveBeenCalled();

        renderer.setMode('deck');
        expect(overlay.attach).toHaveBeenCalledOnce();

        renderer.setMode('deck');
        expect(overlay.attach).toHaveBeenCalledOnce();

        renderer.setMode('dom');
        expect(overlay.detach).toHaveBeenCalledOnce();
    });

    it('removes a cached DOM handle immediately when it is off the map', () => {
        const overlay = makeOverlay();
        const renderer = new HybridMarkerRenderer({
            getDeckOverlay: () => overlay,
        } as never);
        const marker = new Marker({lat: 1, lng: 2}, {icon, color: '#000000', source: 'list'});
        const {handle, remove, classList} = makeHandle();
        marker.setHandle(handle);
        const onRemoved = vi.fn();

        renderer.remove(marker, onRemoved);

        expect(classList.add).not.toHaveBeenCalled();
        expect(remove).toHaveBeenCalledOnce();
        expect(onRemoved).toHaveBeenCalledOnce();
    });
});
