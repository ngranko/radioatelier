import {beforeEach, describe, expect, it, vi} from 'vitest';
import {focusDetailsTarget} from './map.svelte.ts';
import type {Marker} from './marker';
import {
    notifyFocusableMarkerShown,
    registerFocusableMarker,
    setFocusedTarget,
    unregisterFocusableMarker,
} from './markerFocus';

vi.mock('./map.svelte.ts', () => ({
    focusDetailsTarget: vi.fn(),
}));

vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
    callback(0);
    return 0;
});

function makeMarker(lat = 55.75, lng = 37.61) {
    const classList = {
        add: vi.fn(),
        remove: vi.fn(),
    };
    const marker = {
        getHandle: () => ({getElement: () => ({classList})}),
        getPosition: () => ({lat, lng}),
    } as unknown as Marker;
    return {marker, classList};
}

function makeElementlessMarker() {
    return {
        getHandle: () => undefined,
        getPosition: () => ({lat: 0, lng: 0}),
    } as unknown as Marker;
}

describe('marker focus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        setFocusedTarget(null);
    });

    it('highlights and centers a registered marker when it becomes the target', () => {
        const {marker, classList} = makeMarker();
        registerFocusableMarker('object-1', marker);

        setFocusedTarget('object-1');

        expect(classList.add).toHaveBeenCalledWith('scale-120');
        expect(focusDetailsTarget).toHaveBeenCalledWith(55.75, 37.61);
    });

    it('focuses a marker that registers after the target was set', () => {
        const {marker, classList} = makeMarker(48.85, 2.35);

        setFocusedTarget('late-object');
        expect(focusDetailsTarget).not.toHaveBeenCalled();

        registerFocusableMarker('late-object', marker);

        expect(classList.add).toHaveBeenCalledWith('scale-120');
        expect(focusDetailsTarget).toHaveBeenCalledWith(48.85, 2.35);
    });

    it('removes the highlight from the previous target when focus moves', () => {
        const first = makeMarker();
        const second = makeMarker();
        registerFocusableMarker('object-1', first.marker);
        registerFocusableMarker('object-2', second.marker);

        setFocusedTarget('object-1');
        setFocusedTarget('object-2');

        expect(first.classList.remove).toHaveBeenCalledWith('scale-120');
        expect(second.classList.add).toHaveBeenCalledWith('scale-120');
    });

    it('removes the highlight when focus clears', () => {
        const {marker, classList} = makeMarker();
        registerFocusableMarker('object-1', marker);
        setFocusedTarget('object-1');

        setFocusedTarget(null);

        expect(classList.remove).toHaveBeenCalledWith('scale-120');
    });

    it('does not register a stale marker removal over a replacement', () => {
        const first = makeMarker();
        const second = makeMarker();
        registerFocusableMarker('object-1', first.marker);
        registerFocusableMarker('object-1', second.marker);

        unregisterFocusableMarker('object-1', first.marker);
        setFocusedTarget('object-1');

        expect(second.classList.add).toHaveBeenCalledWith('scale-120');
    });

    it('re-applies the highlight when the focused marker is shown by the visibility engine', () => {
        const elementless = makeElementlessMarker();
        registerFocusableMarker('object-1', elementless);
        setFocusedTarget('object-1');
        expect(focusDetailsTarget).toHaveBeenCalledTimes(1);

        const {marker, classList} = makeMarker();
        notifyFocusableMarkerShown('object-1', marker);

        expect(classList.add).toHaveBeenCalledWith('scale-120');
        expect(focusDetailsTarget).toHaveBeenCalledTimes(2);
    });

    it('ignores shown notifications for non-focused markers', () => {
        const {marker, classList} = makeMarker();

        notifyFocusableMarkerShown('object-2', marker);

        expect(classList.add).not.toHaveBeenCalled();
        expect(focusDetailsTarget).not.toHaveBeenCalled();
    });

    it('survives a focused marker without a DOM element yet', () => {
        registerFocusableMarker('object-1', makeElementlessMarker());

        expect(() => setFocusedTarget('object-1')).not.toThrow();
        expect(focusDetailsTarget).toHaveBeenCalled();
    });
});
