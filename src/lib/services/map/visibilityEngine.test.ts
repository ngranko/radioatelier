import {afterEach, beforeEach, describe, expect, it, vi} from 'vitest';
import type {Marker} from './marker';
import type {MarkerRepository} from './markerRepository';
import type {MarkerRenderer} from './renderer/markerRenderer';
import {VisibilityEngine} from './visibilityEngine';

let frames: FrameRequestCallback[] = [];

function flushFrame() {
    const callbacks = frames;
    frames = [];
    for (const callback of callbacks) {
        callback(0);
    }
}

function flushAllFrames() {
    while (frames.length > 0) {
        flushFrame();
    }
}

// Pins the clock so every batch fits its budget; tests that need the engine to yield
// install a clock that advances past the budget instead.
function stubClock(advanceMsPerCall = 0) {
    let now = 0;
    vi.stubGlobal('performance', {
        now: () => {
            now += advanceMsPerCall;
            return now;
        },
    });
}

function makeMarker(): Marker {
    return {getPosition: () => ({lat: 0, lng: 0})} as unknown as Marker;
}

function makeRepo(ids: string[], initiallyVisible: string[] = []) {
    const markers = new Map(ids.map(id => [id, makeMarker()]));
    const visible = new Set(initiallyVisible);
    const repo = {
        entries: () => markers.entries(),
        get: (id: string) => markers.get(id),
        visibleIds: () => visible,
        markVisible: (id: string) => void visible.add(id),
        markHidden: (id: string) => void visible.delete(id),
    } as unknown as MarkerRepository;
    return {repo, markers, visible};
}

function makeRenderer() {
    const shown: Marker[] = [];
    const hidden: Marker[] = [];
    const renderer: MarkerRenderer = {
        ensureCreated: () => {},
        syncAll: () => {},
        show: marker => void shown.push(marker),
        hide: marker => void hidden.push(marker),
        remove: () => {},
        applyState: () => {},
        destroy: () => {},
    };
    return {renderer, shown, hidden};
}

describe('VisibilityEngine', () => {
    beforeEach(() => {
        frames = [];
        vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
            frames.push(callback);
            return frames.length;
        });
        stubClock();
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('shows entering markers and hides leaving ones', () => {
        const {repo, visible} = makeRepo(['a', 'b', 'c'], ['c']);
        const {renderer, shown, hidden} = makeRenderer();
        const engine = new VisibilityEngine(repo, {frameBudgetMs: 8}, renderer);
        const onComplete = vi.fn();

        engine.updateVisibility(new Set(['a', 'b']), onComplete);

        expect(shown).toHaveLength(2);
        expect(hidden).toHaveLength(1);
        expect([...visible].sort()).toEqual(['a', 'b']);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('touches only markers whose visibility changed', () => {
        const ids = Array.from({length: 5000}, (_, index) => `marker-${index}`);
        const {repo} = makeRepo(ids, ['marker-0', 'marker-1']);
        const {renderer, shown, hidden} = makeRenderer();
        const engine = new VisibilityEngine(repo, {frameBudgetMs: 8}, renderer);
        const onComplete = vi.fn();

        engine.updateVisibility(new Set(['marker-1', 'marker-2']), onComplete);

        expect(shown).toHaveLength(1);
        expect(hidden).toHaveLength(1);
        expect(frames).toHaveLength(0);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('spreads work across frames once the time budget is spent', () => {
        stubClock(10);
        const {repo} = makeRepo(['a', 'b', 'c']);
        const {renderer, shown} = makeRenderer();
        const engine = new VisibilityEngine(repo, {frameBudgetMs: 5}, renderer);
        const onComplete = vi.fn();

        engine.updateVisibility(new Set(['a', 'b', 'c']), onComplete);
        expect(shown).toHaveLength(1);
        expect(onComplete).not.toHaveBeenCalled();

        flushFrame();
        expect(shown).toHaveLength(2);

        flushAllFrames();
        expect(shown).toHaveLength(3);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('stops mid-pass when suppressed but still completes', () => {
        stubClock(10);
        const {repo} = makeRepo(['a', 'b', 'c', 'd']);
        const {renderer, shown} = makeRenderer();
        const engine = new VisibilityEngine(repo, {frameBudgetMs: 5}, renderer);
        const onComplete = vi.fn();

        engine.updateVisibility(new Set(['a', 'b', 'c', 'd']), onComplete);
        engine.setSuppressed(true);
        flushAllFrames();

        expect(shown).toHaveLength(1);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('notifies onShown only for markers that became visible', () => {
        const {repo, markers} = makeRepo(['a', 'b'], ['b']);
        const {renderer} = makeRenderer();
        const onShown = vi.fn();
        const engine = new VisibilityEngine(repo, {frameBudgetMs: 8, onShown}, renderer);

        engine.updateVisibility(new Set(['a', 'b']));

        expect(onShown).toHaveBeenCalledTimes(1);
        expect(onShown).toHaveBeenCalledWith(markers.get('a'));
    });
});
