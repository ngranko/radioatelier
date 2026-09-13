import type {Marker} from '$lib/services/map/marker';
import type {DeckOverlayHost} from '$lib/services/map/providers/google/deckOverlayHost';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {cancelActiveMarkerHold, HOLD_MS} from '../markerHold';
import {SpriteDragGesture} from './spriteDragGesture';

type Listener = (event: PointerEvent) => void;

function listenerRegistry() {
    const listeners = new Map<string, Listener[]>();

    return {
        add: (type: string, handler: Listener) => {
            listeners.set(type, [...(listeners.get(type) ?? []), handler]);
        },
        remove: (type: string, handler: Listener) => {
            listeners.set(
                type,
                (listeners.get(type) ?? []).filter(known => known !== handler),
            );
        },
        // A snapshot, like a real dispatch: a cancelling handler unsubscribes the rest mid-flight.
        dispatch: (type: string, event: Partial<PointerEvent>) => {
            for (const handler of (listeners.get(type) ?? []).slice()) {
                handler(event as PointerEvent);
            }
        },
    };
}

function harness(picked: unknown) {
    const containerListeners = listenerRegistry();
    const windowListeners = listenerRegistry();
    const container = {
        addEventListener: containerListeners.add,
        removeEventListener: containerListeners.remove,
        getBoundingClientRect: () => ({left: 0, top: 0}),
    } as unknown as HTMLElement;
    vi.stubGlobal('window', {
        setTimeout: (callback: () => void, ms: number) => setTimeout(callback, ms),
        addEventListener: windowListeners.add,
        removeEventListener: windowListeners.remove,
    });
    const overlay = {pickAt: vi.fn(() => picked)} as unknown as DeckOverlayHost;
    const onHold = vi.fn();
    const onRelease = vi.fn();
    const gesture = new SpriteDragGesture(container, overlay, {onHold, onRelease});
    gesture.attach();

    const pointer = (event: Partial<PointerEvent>) => ({
        clientX: 5,
        clientY: 7,
        pointerId: 1,
        isPrimary: true,
        button: 0,
        ...event,
    });

    return {
        gesture,
        onHold,
        onRelease,
        press: (event: Partial<PointerEvent> = {}) => {
            windowListeners.dispatch('pointerdown', pointer(event));
            containerListeners.dispatch('pointerdown', pointer(event));
        },
        move: (event: Partial<PointerEvent>) =>
            windowListeners.dispatch('pointermove', pointer(event)),
        release: (pointerId = 1) => windowListeners.dispatch('pointerup', {pointerId}),
    };
}

function markerPoint(isDraggable: boolean) {
    return {marker: {options: {isDraggable}} as Marker};
}

describe('SpriteDragGesture', () => {
    beforeEach(() => vi.useFakeTimers());

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('hands a held marker over once the press outlasts a tap', () => {
        const point = markerPoint(true);
        const {press, onHold} = harness(point);

        press();
        vi.advanceTimersByTime(HOLD_MS - 1);
        expect(onHold).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(onHold).toHaveBeenCalledWith(point.marker);
    });

    it('leaves a short press to the click handler', () => {
        const {press, release, onHold} = harness(markerPoint(true));

        press();
        release();
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).not.toHaveBeenCalled();
    });

    it('gives up the hold when the press slides into a pan', () => {
        const {press, move, onHold} = harness(markerPoint(true));

        press();
        move({clientX: 40});
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).not.toHaveBeenCalled();
    });

    it('sits out a finger tremor', () => {
        const point = markerPoint(true);
        const {press, move, onHold} = harness(point);

        press();
        move({clientX: 8, clientY: 9});
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).toHaveBeenCalledWith(point.marker);
    });

    it('gives up the hold when a second finger starts a pinch', () => {
        const {press, release, onHold, onRelease} = harness(markerPoint(true));

        press();
        press({pointerId: 2, isPrimary: false});
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).not.toHaveBeenCalled();

        release(2);
        expect(onRelease).not.toHaveBeenCalled();
    });

    it('can start another gesture after the map cancels its hold', () => {
        const point = markerPoint(true);
        const {press, onHold} = harness(point);

        press();
        cancelActiveMarkerHold();
        press({pointerId: 2});
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).toHaveBeenCalledWith(point.marker);
    });

    it('leaves non-left-button presses to the browser', () => {
        const {press, onHold} = harness(markerPoint(true));

        press({button: 2});
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).not.toHaveBeenCalled();
    });

    it('ignores markers that cannot be moved', () => {
        const notOwned = harness(markerPoint(false));
        notOwned.press();

        vi.advanceTimersByTime(HOLD_MS);

        expect(notOwned.onHold).not.toHaveBeenCalled();
    });
});
