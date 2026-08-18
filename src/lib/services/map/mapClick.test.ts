import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {
    MAP_CLICK_DEBOUNCE_MS,
    MapClickTimeout,
    RENDERER_CLICK_WINDOW_MS,
    takePairedRendererClick,
} from './mapClick';

describe('MapClickTimeout', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('replaces a pending timeout so only the latest callback runs', () => {
        const timeout = new MapClickTimeout();
        const first = vi.fn();
        const second = vi.fn();

        timeout.replace(first, MAP_CLICK_DEBOUNCE_MS);
        timeout.replace(second, MAP_CLICK_DEBOUNCE_MS);
        vi.advanceTimersByTime(MAP_CLICK_DEBOUNCE_MS);

        expect(first).not.toHaveBeenCalled();
        expect(second).toHaveBeenCalledOnce();
        expect(timeout.isPending).toBe(false);
    });

    it('does not let a stale callback clear a newer timeout', () => {
        const timeout = new MapClickTimeout();
        const first = vi.fn();
        const second = vi.fn();

        timeout.replace(first, MAP_CLICK_DEBOUNCE_MS);
        vi.advanceTimersByTime(MAP_CLICK_DEBOUNCE_MS - 1);
        timeout.replace(second, MAP_CLICK_DEBOUNCE_MS);
        vi.advanceTimersByTime(1);

        expect(first).not.toHaveBeenCalled();
        expect(second).not.toHaveBeenCalled();
        expect(timeout.isPending).toBe(true);

        vi.advanceTimersByTime(MAP_CLICK_DEBOUNCE_MS - 1);
        expect(second).toHaveBeenCalledOnce();
    });

    it('clear() cancels every pending callback', () => {
        const timeout = new MapClickTimeout();
        const callback = vi.fn();

        timeout.replace(callback, MAP_CLICK_DEBOUNCE_MS);
        expect(timeout.clear()).toBe(true);
        vi.advanceTimersByTime(MAP_CLICK_DEBOUNCE_MS);

        expect(callback).not.toHaveBeenCalled();
        expect(timeout.clear()).toBe(false);
    });
});

describe('takePairedRendererClick', () => {
    it('matches only the paired map event, not a later empty-map click', () => {
        const rendererAt = 1_000;

        expect(takePairedRendererClick(rendererAt, rendererAt + 10)).toBe(true);
        expect(takePairedRendererClick(undefined, rendererAt + 20)).toBe(false);
    });

    it('does not treat a stale renderer interaction as the paired click', () => {
        expect(takePairedRendererClick(1_000, 1_000 + RENDERER_CLICK_WINDOW_MS)).toBe(false);
    });
});
