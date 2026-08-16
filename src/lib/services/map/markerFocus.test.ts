import {beforeEach, describe, expect, it, vi} from 'vitest';
import {focusDetailsTarget} from './map.svelte.ts';
import type {Marker} from './marker';
import {
    notifyFocusableMarkerShown,
    onFocusedMarkerChange,
    registerFocusableMarker,
    setFocusedTarget,
} from './markerFocus';

vi.mock('./map.svelte.ts', () => ({
    focusDetailsTarget: vi.fn(),
}));

function stubImmediateAnimationFrame() {
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        callback(0);
        return 0;
    });
}

function stubDeferredAnimationFrame() {
    const pending = new Map<number, FrameRequestCallback>();
    let nextId = 1;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        const id = nextId++;
        pending.set(id, callback);
        return id;
    });
    return {
        flush() {
            for (const callback of pending.values()) {
                callback(0);
            }
            pending.clear();
        },
    };
}

stubImmediateAnimationFrame();

function makeMarker(lat = 55.75, lng = 37.61, isShown = true) {
    const classList = {
        add: vi.fn(),
        remove: vi.fn(),
    };
    let shown = isShown;
    const marker = {
        getHandle: () => (shown ? {getElement: () => ({classList})} : undefined),
        getPosition: () => ({lat, lng}),
    } as unknown as Marker;
    return {
        marker,
        classList,
        show() {
            shown = true;
        },
    };
}

describe('marker focus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        stubImmediateAnimationFrame();
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

    it('notifies renderers when the focused marker changes', () => {
        const {marker} = makeMarker();
        const listener = vi.fn();
        const unsubscribe = onFocusedMarkerChange(listener);
        registerFocusableMarker('object-1', marker);

        setFocusedTarget('object-1');
        setFocusedTarget(null);
        unsubscribe();

        expect(listener.mock.calls.map(([value]) => value)).toEqual([undefined, marker, undefined]);
    });

    it('removes the highlight from the previous target when focus moves', () => {
        const first = makeMarker();
        const second = makeMarker();
        registerFocusableMarker('object-1', first.marker);
        registerFocusableMarker('object-2', second.marker);

        setFocusedTarget('object-1');
        setFocusedTarget('object-2');

        expect(first.classList.remove).toHaveBeenCalledWith('scale-120', 'duration-100');
        expect(second.classList.add).toHaveBeenCalledWith('scale-120');
    });

    it('removes the highlight when focus clears', () => {
        const {marker, classList} = makeMarker();
        registerFocusableMarker('object-1', marker);
        setFocusedTarget('object-1');

        setFocusedTarget(null);

        expect(classList.remove).toHaveBeenCalledWith('scale-120', 'duration-100');
    });

    it('does not let stale cleanup or animation affect a replacement', () => {
        const frames = stubDeferredAnimationFrame();
        const first = makeMarker();
        const second = makeMarker();
        const unregisterFirst = registerFocusableMarker('object-1', first.marker);

        setFocusedTarget('object-1');
        registerFocusableMarker('object-1', second.marker);

        unregisterFirst();
        frames.flush();

        expect(first.classList.add).not.toHaveBeenCalledWith('scale-120');
        expect(second.classList.add).toHaveBeenCalledWith('scale-120');
    });

    it('re-applies the highlight when the focused marker is shown by the visibility engine', () => {
        const focused = makeMarker(0, 0, false);
        registerFocusableMarker('object-1', focused.marker);
        setFocusedTarget('object-1');
        expect(focusDetailsTarget).toHaveBeenCalledTimes(1);

        focused.show();
        notifyFocusableMarkerShown(focused.marker);

        expect(focused.classList.add).toHaveBeenCalledWith('scale-120');
        expect(focusDetailsTarget).toHaveBeenCalledTimes(2);
    });

    it('ignores shown notifications for non-focused markers', () => {
        const focused = makeMarker();
        const other = makeMarker();
        registerFocusableMarker('object-1', focused.marker);
        setFocusedTarget('object-1');
        vi.clearAllMocks();

        notifyFocusableMarkerShown(other.marker);

        expect(other.classList.add).not.toHaveBeenCalled();
        expect(focusDetailsTarget).not.toHaveBeenCalled();
    });

    it('does not apply a stale highlight after focus clears before the deferred frame', () => {
        const frames = stubDeferredAnimationFrame();
        const {marker, classList} = makeMarker();
        registerFocusableMarker('object-1', marker);

        setFocusedTarget('object-1');
        expect(classList.add).toHaveBeenCalledWith('duration-100');
        expect(classList.add).not.toHaveBeenCalledWith('scale-120');

        setFocusedTarget(null);
        frames.flush();

        expect(classList.add).not.toHaveBeenCalledWith('scale-120');
    });

    it('does not apply a stale highlight after focus moves before the deferred frame', () => {
        const frames = stubDeferredAnimationFrame();
        const first = makeMarker();
        const second = makeMarker();
        registerFocusableMarker('object-1', first.marker);
        registerFocusableMarker('object-2', second.marker);

        setFocusedTarget('object-1');
        setFocusedTarget('object-2');
        frames.flush();

        expect(first.classList.add).not.toHaveBeenCalledWith('scale-120');
        expect(second.classList.add).toHaveBeenCalledWith('scale-120');
    });
});
