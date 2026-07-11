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

function makeMarker(): Marker {
    return {getPosition: () => ({lat: 0, lng: 0})} as unknown as Marker;
}

function makeRepo(ids: string[], initiallyVisible: string[] = []) {
    const markers = new Map(ids.map(id => [id, makeMarker()]));
    const visible = new Set(initiallyVisible);
    const repo = {
        ids: () => [...markers.keys()],
        get: (id: string) => markers.get(id),
        isVisible: (id: string) => visible.has(id),
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
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it('shows entering markers and hides leaving ones', () => {
        const {repo, visible} = makeRepo(['a', 'b', 'c'], ['c']);
        const {renderer, shown, hidden} = makeRenderer();
        const engine = new VisibilityEngine(repo, {chunkSize: 10}, renderer);
        const onComplete = vi.fn();

        engine.updateVisibility(new Set(['a', 'b']), onComplete);
        flushAllFrames();

        expect(shown).toHaveLength(2);
        expect(hidden).toHaveLength(1);
        expect([...visible].sort()).toEqual(['a', 'b']);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('processes markers in chunks across animation frames', () => {
        const {repo} = makeRepo(['a', 'b', 'c', 'd', 'e']);
        const {renderer, shown} = makeRenderer();
        const engine = new VisibilityEngine(repo, {chunkSize: 2}, renderer);

        engine.updateVisibility(new Set(['a', 'b', 'c', 'd', 'e']));
        expect(shown).toHaveLength(0);

        flushFrame();
        expect(shown).toHaveLength(2);

        flushFrame();
        expect(shown).toHaveLength(4);

        flushFrame();
        expect(shown).toHaveLength(5);
        expect(frames).toHaveLength(0);
    });

    it('stops mid-pass when suppressed but still completes', () => {
        const {repo} = makeRepo(['a', 'b', 'c', 'd']);
        const {renderer, shown} = makeRenderer();
        const engine = new VisibilityEngine(repo, {chunkSize: 2}, renderer);
        const onComplete = vi.fn();

        engine.updateVisibility(new Set(['a', 'b', 'c', 'd']), onComplete);
        flushFrame();
        engine.setSuppressed(true);
        flushAllFrames();

        expect(shown).toHaveLength(2);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });

    it('notifies onShown only for markers that became visible', () => {
        const {repo, markers} = makeRepo(['a', 'b'], ['b']);
        const {renderer} = makeRenderer();
        const onShown = vi.fn();
        const engine = new VisibilityEngine(repo, {chunkSize: 10, onShown}, renderer);

        engine.updateVisibility(new Set(['a', 'b']));
        flushAllFrames();

        expect(onShown).toHaveBeenCalledTimes(1);
        expect(onShown).toHaveBeenCalledWith('a', markers.get('a'));
    });

    it('does no renderer work for unchanged visibility', () => {
        const {repo} = makeRepo(['a', 'b'], ['a']);
        const {renderer, shown, hidden} = makeRenderer();
        const onShown = vi.fn();
        const engine = new VisibilityEngine(repo, {chunkSize: 10, onShown}, renderer);

        engine.updateVisibility(new Set(['a']));
        flushAllFrames();

        expect(shown).toHaveLength(0);
        expect(hidden).toHaveLength(0);
        expect(onShown).not.toHaveBeenCalled();
    });

    it('cancels the remaining chunks of an active update', () => {
        const {repo} = makeRepo(['a', 'b', 'c', 'd']);
        const {renderer, shown} = makeRenderer();
        const engine = new VisibilityEngine(repo, {chunkSize: 2}, renderer);
        const onComplete = vi.fn();

        engine.updateVisibility(new Set(['a', 'b', 'c', 'd']), onComplete);
        flushFrame();
        engine.cancelUpdate();
        flushAllFrames();

        expect(shown).toHaveLength(2);
        expect(onComplete).toHaveBeenCalledTimes(1);
    });
});
