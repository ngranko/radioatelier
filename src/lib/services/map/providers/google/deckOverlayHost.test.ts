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

    function createMap() {
        const setOptions = vi.fn();
        const containers = [{remove: vi.fn()}, {remove: vi.fn()}];
        const querySelectorAll = vi.fn().mockReturnValue(containers);
        const map = {
            getDiv: () => ({querySelectorAll}),
            setOptions,
        } as unknown as google.maps.Map;
        return {map, setOptions, containers};
    }

    type HoverHandler = (info: {object?: unknown}) => void;

    function lastHoverHandler(): HoverHandler {
        const calls = overlay.setProps.mock.calls as [{onHover?: HoverHandler}][];
        const handler = calls.findLast(([props]) => props.onHover)?.[0].onHover;
        if (!handler) {
            throw new Error('overlay was attached without a hover handler');
        }
        return handler;
    }

    it('reuses one non-interleaved overlay and finalizes it with the map', () => {
        const {map, containers} = createMap();
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
        expect(overlay.setProps).toHaveBeenCalledWith(expect.objectContaining({layerFilter: null}));
        expect(overlay.setProps).toHaveBeenCalledWith({layers: []});

        host.destroy();

        expect(overlay.finalize).toHaveBeenCalledOnce();
        for (const container of containers) {
            expect(container.remove).toHaveBeenCalledOnce();
        }
    });

    it('switches the map cursor to a pointer while a picked object is hovered', () => {
        const {map, setOptions} = createMap();
        const host = new DeckOverlayHost(map);
        host.attach();
        const onHover = lastHoverHandler();

        onHover({object: {id: 'marker'}});
        onHover({object: {id: 'marker'}});
        onHover({});

        expect(setOptions.mock.calls).toEqual([
            [{draggableCursor: 'pointer'}],
            [{draggableCursor: null}],
        ]);
    });

    it('restores the map cursor when the overlay detaches mid-hover', () => {
        const {map, setOptions} = createMap();
        const host = new DeckOverlayHost(map);
        host.attach();

        lastHoverHandler()({object: {id: 'cluster'}});
        host.detach();

        expect(setOptions).toHaveBeenLastCalledWith({draggableCursor: null});
    });
});
