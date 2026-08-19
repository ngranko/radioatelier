import type {Marker} from '$lib/services/map/marker';
import type {DeckOverlayHost} from '$lib/services/map/providers/google/deckOverlayHost';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {SpriteDragGesture} from './spriteDragGesture';

function harness(picked: unknown) {
    const listeners = new Map<string, (event: PointerEvent) => void>();
    const listen = (type: string, handler: (event: PointerEvent) => void) =>
        listeners.set(type, handler);
    const container = {
        addEventListener: listen,
        removeEventListener: (type: string) => listeners.delete(type),
        getBoundingClientRect: () => ({left: 0, top: 0}),
    } as unknown as HTMLElement;
    vi.stubGlobal('window', {
        setTimeout: (callback: () => void, ms: number) => setTimeout(callback, ms),
        addEventListener: listen,
        removeEventListener: (type: string) => listeners.delete(type),
    });
    const overlay = {pickAt: vi.fn(() => picked)} as unknown as DeckOverlayHost;
    const onHold = vi.fn();
    const onRelease = vi.fn();
    const gesture = new SpriteDragGesture(container, overlay, {onHold, onRelease});
    gesture.attach();

    return {
        gesture,
        onHold,
        onRelease,
        press: () => listeners.get('pointerdown')?.({clientX: 5, clientY: 7} as PointerEvent),
        release: () => listeners.get('pointerup')?.({} as PointerEvent),
    };
}

function markerPoint(isDraggable: boolean) {
    return {kind: 'marker', marker: {options: {isDraggable}} as Marker};
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
        expect(onHold).not.toHaveBeenCalled();

        vi.advanceTimersByTime(300);
        expect(onHold).toHaveBeenCalledWith(point.marker);
    });

    it('leaves a short press to the click handler', () => {
        const {press, release, onHold} = harness(markerPoint(true));

        press();
        release();
        vi.advanceTimersByTime(300);

        expect(onHold).not.toHaveBeenCalled();
    });

    it('ignores markers that cannot be moved and clusters', () => {
        const notOwned = harness(markerPoint(false));
        notOwned.press();
        const cluster = harness({kind: 'cluster'});
        cluster.press();

        vi.advanceTimersByTime(300);

        expect(notOwned.onHold).not.toHaveBeenCalled();
        expect(cluster.onHold).not.toHaveBeenCalled();
    });
});
