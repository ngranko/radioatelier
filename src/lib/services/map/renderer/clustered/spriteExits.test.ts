import type {Marker} from '$lib/services/map/marker';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {latestExit, SpriteExitTracker} from './spriteExits';
import {SPRITE_POP_OUT_MS} from './spritePopExtension';

function marker(): Marker {
    return {
        getPosition: () => ({lat: 55.75, lng: 37.61}),
        getState: () => ({isVisited: false, isRemoved: false}),
        options: {color: '#112233', iconKey: 'zap'},
    } as Marker;
}

describe('SpriteExitTracker', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    it('keeps drawing a removed marker from a copy of its sprite', () => {
        const tracker = new SpriteExitTracker();

        tracker.start(marker());

        const [exit] = tracker.active();
        expect(exit?.position).toEqual([37.61, 55.75]);
        expect(exit?.sprite.id).toContain('zap');
    });

    it('drops the copy once the exit has played', () => {
        const tracker = new SpriteExitTracker();
        tracker.start(marker());

        vi.advanceTimersByTime(SPRITE_POP_OUT_MS);

        expect(tracker.active()).toEqual([]);
    });

    it('reports the newest exit, which is how long the layer keeps animating', () => {
        const tracker = new SpriteExitTracker();
        tracker.start(marker());
        vi.advanceTimersByTime(SPRITE_POP_OUT_MS / 3);
        tracker.start(marker());

        const exits = tracker.active();

        expect(latestExit(exits)).toBe(exits[1]?.leftAt);
    });
});
