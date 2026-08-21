import type {Marker} from '$lib/services/map/marker';
import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import {findLatestExitTime, SpriteExitTracker} from './spriteExits';
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

        tracker.keep(marker());

        const [exit] = tracker.listActive();
        expect(exit?.position).toEqual([37.61, 55.75]);
        expect(exit?.sprite.id).toContain('zap');
    });

    it('drops the copy once the exit has played', () => {
        const tracker = new SpriteExitTracker();
        tracker.keep(marker());

        vi.advanceTimersByTime(SPRITE_POP_OUT_MS);

        expect(tracker.listActive()).toEqual([]);
    });

    it('reports the newest exit, which is how long the layer keeps animating', () => {
        const tracker = new SpriteExitTracker();
        tracker.keep(marker());
        vi.advanceTimersByTime(SPRITE_POP_OUT_MS / 3);
        tracker.keep(marker());

        const exits = tracker.listActive();

        expect(findLatestExitTime(exits)).toBe(exits[1]?.leftAt);
    });
});
