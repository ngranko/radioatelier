import {afterEach, beforeEach, describe, expect, it, type Mock, vi} from 'vitest';
import {cancelActiveMarkerHold, HOLD_MS, MarkerHold} from './markerHold';

type Listener = (event: Event) => void;

function stubWindow() {
    const listeners = new Map<string, Listener[]>();
    vi.stubGlobal('window', {
        setTimeout: (callback: () => void, ms: number) => setTimeout(callback, ms),
        addEventListener: (type: string, handler: Listener) => {
            listeners.set(type, [...(listeners.get(type) ?? []), handler]);
        },
        removeEventListener: (type: string, handler: Listener) => {
            listeners.set(
                type,
                (listeners.get(type) ?? []).filter(known => known !== handler),
            );
        },
    });

    return {
        // A snapshot, like a real dispatch: a cancelling handler unsubscribes the rest mid-flight.
        dispatch: (type: string, event: Partial<PointerEvent> = {}) => {
            for (const handler of (listeners.get(type) ?? []).slice()) {
                handler(event as Event);
            }
        },
        countFor: (type: string) => listeners.get(type)?.length ?? 0,
    };
}

function press(overrides: Partial<PointerEvent> = {}): PointerEvent {
    return {pointerId: 1, clientX: 100, clientY: 100, ...overrides} as PointerEvent;
}

describe('MarkerHold', () => {
    let listeners: ReturnType<typeof stubWindow>;
    let onHold: Mock<() => void>;
    let hold: MarkerHold;

    beforeEach(() => {
        vi.useFakeTimers();
        listeners = stubWindow();
        onHold = vi.fn();
        hold = new MarkerHold();
    });

    afterEach(() => {
        cancelActiveMarkerHold();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('fires once the press outlasts a tap', () => {
        hold.arm(press(), onHold);

        vi.advanceTimersByTime(HOLD_MS - 1);
        expect(onHold).not.toHaveBeenCalled();

        vi.advanceTimersByTime(1);
        expect(onHold).toHaveBeenCalledOnce();
    });

    it('stops watching the pointer once it fired', () => {
        hold.arm(press(), onHold);
        vi.advanceTimersByTime(HOLD_MS);

        expect(listeners.countFor('pointermove')).toBe(0);
        expect(listeners.countFor('pointerup')).toBe(0);
    });

    it('drops the hold when the press slides away', () => {
        hold.arm(press(), onHold);
        listeners.dispatch('pointermove', press({clientX: 120}));
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).not.toHaveBeenCalled();
    });

    it('keeps the hold through a slight tremor', () => {
        hold.arm(press(), onHold);
        listeners.dispatch('pointermove', press({clientX: 104, clientY: 103}));
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).toHaveBeenCalledOnce();
    });

    it('ignores movement of another pointer', () => {
        hold.arm(press(), onHold);
        listeners.dispatch('pointermove', press({pointerId: 2, clientX: 400}));
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).toHaveBeenCalledOnce();
    });

    it('drops the hold when a second finger lands', () => {
        hold.arm(press(), onHold);
        listeners.dispatch('pointerdown', press({pointerId: 2}));
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).not.toHaveBeenCalled();
    });

    it('drops the hold when its pointer is released or cancelled', () => {
        hold.arm(press(), onHold);
        listeners.dispatch('pointercancel', press());
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).not.toHaveBeenCalled();
    });

    it('drops the hold when the wheel zooms the map', () => {
        hold.arm(press(), onHold);
        listeners.dispatch('wheel');
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).not.toHaveBeenCalled();
    });

    it('drops the hold when the map takes over the gesture', () => {
        hold.arm(press(), onHold);
        cancelActiveMarkerHold();
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).not.toHaveBeenCalled();
        expect(listeners.countFor('pointermove')).toBe(0);
    });

    it('keeps only the last armed hold', () => {
        const other = new MarkerHold();
        const onOtherHold = vi.fn();

        hold.arm(press(), onHold);
        other.arm(press({pointerId: 2}), onOtherHold);
        vi.advanceTimersByTime(HOLD_MS);

        expect(onHold).not.toHaveBeenCalled();
        expect(onOtherHold).toHaveBeenCalledOnce();
    });
});
