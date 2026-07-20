import {beforeEach, describe, expect, it, vi} from 'vitest';

const overlay = vi.hoisted(() => ({
    constructor: vi.fn(),
    finalize: vi.fn(),
    setMap: vi.fn(),
    setProps: vi.fn(),
}));

vi.mock('@deck.gl/google-maps', () => ({
    GoogleMapsOverlay: class {
        constructor(props: unknown) {
            overlay.constructor(props);
        }

        setMap(map: unknown) {
            overlay.setMap(map);
        }

        setProps(props: unknown) {
            overlay.setProps(props);
        }

        finalize() {
            overlay.finalize();
        }
    },
}));

import {DeckOverlayHost} from './deckOverlayHost';

describe('DeckOverlayHost', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('reuses one non-interleaved overlay and finalizes it with the map', () => {
        const containers = [{remove: vi.fn()}, {remove: vi.fn()}];
        const querySelectorAll = vi.fn().mockReturnValue(containers);
        const map = {
            getDiv: () => ({querySelectorAll}),
        } as unknown as google.maps.Map;
        const host = new DeckOverlayHost(map);

        host.attach();
        host.detach();
        host.attach();

        expect(overlay.constructor).toHaveBeenCalledOnce();
        expect(overlay.constructor).toHaveBeenCalledWith({
            layers: [],
            interleaved: false,
        });
        expect(overlay.setMap).toHaveBeenNthCalledWith(1, map);
        expect(overlay.setMap).toHaveBeenNthCalledWith(2, null);
        expect(overlay.setMap).toHaveBeenNthCalledWith(3, map);
        expect(overlay.setProps).toHaveBeenCalledWith({layerFilter: null});
        expect(overlay.setProps).toHaveBeenCalledWith({layers: []});

        host.destroy();

        expect(overlay.finalize).toHaveBeenCalledOnce();
        for (const container of containers) {
            expect(container.remove).toHaveBeenCalledOnce();
        }
    });
});
