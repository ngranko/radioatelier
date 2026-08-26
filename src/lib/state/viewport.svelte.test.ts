import {afterEach, beforeEach, describe, expect, it} from 'vitest';
import {trackViewportMetrics, viewportMetrics} from './viewport.svelte.ts';

interface FakeViewport {
    height: number;
    offsetTop: number;
}

type ListenerRegistry = Map<string, Set<() => void>>;

let windowListeners: ListenerRegistry;
let visualListeners: ListenerRegistry;
let fakeWindow: {innerHeight: number; visualViewport: FakeViewport};

function createEventTarget(registry: ListenerRegistry) {
    return {
        addEventListener(type: string, listener: () => void) {
            const forType = registry.get(type) ?? new Set<() => void>();
            forType.add(listener);
            registry.set(type, forType);
        },
        removeEventListener(type: string, listener: () => void) {
            registry.get(type)?.delete(listener);
        },
    };
}

function countListeners(registry: ListenerRegistry) {
    return [...registry.values()].reduce((total, forType) => total + forType.size, 0);
}

function stubWindow(innerHeight: number, visual: FakeViewport) {
    windowListeners = new Map();
    visualListeners = new Map();
    fakeWindow = {
        innerHeight,
        visualViewport: {...visual, ...createEventTarget(visualListeners)},
        ...createEventTarget(windowListeners),
    };

    Object.defineProperty(globalThis, 'window', {configurable: true, value: fakeWindow});
}

function dispatch(registry: ListenerRegistry, type: string) {
    registry.get(type)?.forEach(listener => listener());
}

function emitViewportChange(visual: FakeViewport) {
    Object.assign(fakeWindow.visualViewport, visual);
    dispatch(visualListeners, 'resize');
}

describe('viewport metrics', () => {
    beforeEach(() => {
        stubWindow(800, {height: 800, offsetTop: 0});
    });

    afterEach(() => {
        Reflect.deleteProperty(globalThis, 'window');
    });

    it('measures the full viewport while no keyboard is open', () => {
        const stopTracking = trackViewportMetrics();

        expect(viewportMetrics.height).toBe(800);
        expect(viewportMetrics.offsetTop).toBe(0);

        stopTracking();
    });

    it('measures a shrunken visual viewport', () => {
        const stopTracking = trackViewportMetrics();

        emitViewportChange({height: 500, offsetTop: 0});

        expect(viewportMetrics.height).toBe(500);
        expect(viewportMetrics.offsetTop).toBe(0);

        stopTracking();
    });

    it('tracks where a panned visual viewport begins', () => {
        const stopTracking = trackViewportMetrics();

        emitViewportChange({height: 500, offsetTop: 120});

        expect(viewportMetrics.offsetTop).toBe(120);

        stopTracking();
    });

    it('follows a resize of the layout viewport', () => {
        const stopTracking = trackViewportMetrics();

        fakeWindow.innerHeight = 600;
        Object.assign(fakeWindow.visualViewport, {height: 600, offsetTop: 0});
        dispatch(windowListeners, 'resize');

        expect(viewportMetrics.height).toBe(600);

        stopTracking();
    });

    it('drops every listener once the last tracker stops', () => {
        const stopFirst = trackViewportMetrics();
        const stopSecond = trackViewportMetrics();

        stopFirst();
        expect(countListeners(visualListeners)).toBe(2);
        expect(countListeners(windowListeners)).toBe(1);

        stopSecond();
        expect(countListeners(visualListeners)).toBe(0);
        expect(countListeners(windowListeners)).toBe(0);
    });

    it('keeps tracking for a later tracker when a cleanup runs twice', () => {
        const stopTracking = trackViewportMetrics();
        stopTracking();
        stopTracking();

        const stopLaterTracker = trackViewportMetrics();
        emitViewportChange({height: 500, offsetTop: 0});

        expect(viewportMetrics.height).toBe(500);

        stopLaterTracker();
    });
});
