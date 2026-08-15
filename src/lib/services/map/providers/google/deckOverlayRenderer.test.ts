import {markerLifecycle} from '$lib/services/map/markerLifecycle';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {DeckOverlayHost} from './deckOverlayHost';

vi.mock('@deck.gl/layers', () => ({
    ScatterplotLayer: class {},
}));

import {DeckOverlayRenderer} from './deckOverlayRenderer';

describe('DeckOverlayRenderer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        markerLifecycle.reset();
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
        markerLifecycle.reset();
    });

    it('detaches without allowing a queued render to update the shared overlay', () => {
        const attach = vi.fn();
        const detach = vi.fn();
        const setLayers = vi.fn();
        const overlay = {
            attach,
            detach,
            setLayers,
        } as unknown as DeckOverlayHost;
        const renderer = new DeckOverlayRenderer(overlay);
        renderer.syncAll([]);
        renderer.destroy();
        vi.runAllTimers();

        expect(attach).toHaveBeenCalledOnce();
        expect(detach).toHaveBeenCalledOnce();
        expect(setLayers).not.toHaveBeenCalled();
    });

    it('ends lifecycle tracking when render throws', () => {
        const frames: FrameRequestCallback[] = [];
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            frames.push(callback);
            return frames.length;
        });
        const overlay = {
            attach: vi.fn(),
            detach: vi.fn(),
            setLayers: vi.fn(),
        } as unknown as DeckOverlayHost;
        const renderer = new DeckOverlayRenderer(overlay);
        renderer.ensureCreated({
            getPosition: () => {
                throw new Error('render failed');
            },
            getState: () => ({isVisited: false, isRemoved: false}),
            options: {color: '#000000'},
        } as never);

        vi.advanceTimersByTime(16);
        expect(() => frames[0](0)).toThrow('render failed');
        expect(markerLifecycle.isIdle).toBe(true);
        renderer.destroy();
    });
});
