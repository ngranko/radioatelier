import {afterEach, describe, expect, it, vi} from 'vitest';
import {PopAnimator} from './popAnimation';
import {REVEAL_TIMEOUT_MS} from './revealWatcher';

function makeElement() {
    const element = new EventTarget();
    const classes = new Set<string>();
    const style: Record<string, string> = {visibility: ''};
    Object.assign(element, {
        classList: {
            add: (className: string) => void classes.add(className),
            remove: (className: string) => void classes.delete(className),
        },
        style,
    });
    return {element: element as unknown as HTMLElement, classes, style};
}

function stubObserver() {
    const callbacks: IntersectionObserverCallback[] = [];
    const observed = new Set<Element>();

    class Stub {
        public constructor(callback: IntersectionObserverCallback) {
            callbacks.push(callback);
        }
        public observe(element: Element) {
            observed.add(element);
        }
        public unobserve(element: Element) {
            observed.delete(element);
        }
    }
    vi.stubGlobal('IntersectionObserver', Stub);

    return {
        observed,
        reveal(element: Element) {
            const entries = [{target: element, isIntersecting: true}];
            for (const callback of callbacks) {
                callback(entries as unknown as IntersectionObserverEntry[], {} as never);
            }
        },
    };
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
});

describe('PopAnimator', () => {
    it('holds the marker hidden until the map puts it on screen', () => {
        const observer = stubObserver();
        const {element, classes, style} = makeElement();

        new PopAnimator().popIn(element);
        expect(style.visibility).toBe('hidden');
        expect(classes.has('animate-popin')).toBe(false);

        observer.reveal(element);
        expect(style.visibility).toBe('');
        expect(classes.has('animate-popin')).toBe(true);
    });

    it('stops observing a marker it has already revealed', () => {
        const observer = stubObserver();
        const {element} = makeElement();

        new PopAnimator().popIn(element);
        expect(observer.observed.has(element)).toBe(true);

        observer.reveal(element);
        expect(observer.observed.has(element)).toBe(false);
    });

    it('plays anyway once the wait runs out', () => {
        vi.useFakeTimers();
        stubObserver();
        const {element, classes} = makeElement();

        new PopAnimator().popIn(element);
        vi.advanceTimersByTime(REVEAL_TIMEOUT_MS - 1);
        expect(classes.has('animate-popin')).toBe(false);

        vi.advanceTimersByTime(1);
        expect(classes.has('animate-popin')).toBe(true);
    });

    it('falls back to the timeout when IntersectionObserver is unavailable', () => {
        vi.useFakeTimers();
        vi.stubGlobal('IntersectionObserver', undefined);
        const {element, classes, style} = makeElement();

        new PopAnimator().popIn(element);
        expect(style.visibility).toBe('hidden');

        vi.advanceTimersByTime(REVEAL_TIMEOUT_MS);
        expect(classes.has('animate-popin')).toBe(true);
    });

    it.each(['animationend', 'animationcancel'])('cleans up on %s', eventName => {
        const observer = stubObserver();
        const {element, classes, style} = makeElement();

        new PopAnimator().popIn(element);
        observer.reveal(element);
        expect(classes.has('animate-popin')).toBe(true);

        element.dispatchEvent(new Event(eventName));
        expect(classes.has('animate-popin')).toBe(false);
        expect(style.visibility).toBe('');
    });

    it('cancels a pending animation and allows another one', () => {
        const observer = stubObserver();
        const {element, classes, style} = makeElement();
        const animator = new PopAnimator();

        animator.popIn(element);
        observer.reveal(element);
        animator.cancel(element);
        expect(classes.has('animate-popin')).toBe(false);
        expect(style.visibility).toBe('');

        animator.popIn(element);
        observer.reveal(element);
        expect(classes.has('animate-popin')).toBe(true);
    });

    it('drops the hold when cancelled before the marker is revealed', () => {
        vi.useFakeTimers();
        const observer = stubObserver();
        const {element, classes, style} = makeElement();
        const animator = new PopAnimator();

        animator.popIn(element);
        animator.cancel(element);
        expect(style.visibility).toBe('');
        expect(observer.observed.has(element)).toBe(false);

        vi.advanceTimersByTime(REVEAL_TIMEOUT_MS);
        expect(classes.has('animate-popin')).toBe(false);
    });
});
