import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';

import type {DeckOverlayHost} from './deckOverlayHost';

vi.mock('@deck.gl/layers', () => ({
    ScatterplotLayer: class {},
}));

import {DeckOverlayRenderer} from './deckOverlayRenderer';

describe('DeckOverlayRenderer', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
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
});
