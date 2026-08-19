import type {Marker} from '$lib/services/map/marker';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {MarkerPoint} from './markerPoints';
import {SPRITE_FADE_MS, SpriteFadeTracker} from './spriteFades';

function markerPoint(state: {isVisited: boolean}): MarkerPoint {
    return {
        position: [37.61, 55.75],
        marker: {
            getState: () => ({isVisited: state.isVisited, isRemoved: false}),
            options: {color: '#112233', iconKey: 'zap'},
        } as Marker,
    };
}

describe('SpriteFadeTracker', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('has nothing to fade until a sprite actually changes', () => {
        const tracker = new SpriteFadeTracker();
        const state = {isVisited: false};
        const point = markerPoint(state);

        expect(tracker.track([point])).toEqual([]);
        expect(tracker.track([point])).toEqual([]);
    });

    it('holds the outgoing sprite opaque for one frame, then lets deck.gl ease it out', () => {
        const tracker = new SpriteFadeTracker();
        const state = {isVisited: false};
        const point = markerPoint(state);
        tracker.track([point]);

        state.isVisited = true;
        const [started] = tracker.track([point]);
        expect(started?.fresh).toBe(true);
        expect(started?.sprite.id).toContain('plain');

        expect(tracker.track([point])[0]?.fresh).toBe(false);
    });

    it('drops the outgoing sprite once the fade has run', () => {
        const tracker = new SpriteFadeTracker();
        const state = {isVisited: false};
        const point = markerPoint(state);
        tracker.track([point]);
        state.isVisited = true;
        tracker.track([point]);
        tracker.track([point]);

        vi.advanceTimersByTime(SPRITE_FADE_MS);

        expect(tracker.track([point])).toEqual([]);
    });

    it('drops the outgoing sprite when its marker leaves the viewport', () => {
        const tracker = new SpriteFadeTracker();
        const state = {isVisited: false};
        const point = markerPoint(state);
        tracker.track([point]);
        state.isVisited = true;
        tracker.track([point]);

        expect(tracker.track([])).toEqual([]);
    });
});
