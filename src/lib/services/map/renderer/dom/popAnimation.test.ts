import {markerLifecycle} from '$lib/services/map/markerLifecycle';
import {afterEach, describe, expect, it, vi} from 'vitest';
import {MAX_STARTS_PER_FRAME, POP_OUT_FALLBACK_MS, PopAnimator} from './popAnimation';
import {REVEAL_TIMEOUT_MS} from './revealWatcher';

function makeElement() {
    const element = new EventTarget();
    const classes = new Set<string>();
    const style: Record<string, string> = {
        scale: '',
        transitionProperty: '',
        visibility: '',
    };
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

function stubFrames() {
    let nextId = 1;
    const pending = new Map<number, FrameRequestCallback>();
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
        const id = nextId++;
        pending.set(id, callback);
        return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => void pending.delete(id));

    return {
        advance() {
            const callbacks = [...pending.values()];
            pending.clear();
            for (const callback of callbacks) {
                callback(0);
            }
        },
    };
}

afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
    markerLifecycle.reset();
});

describe('PopAnimator', () => {
    it('holds the marker hidden until the map puts it on screen', () => {
        const observer = stubObserver();
        const frames = stubFrames();
        const {element, classes, style} = makeElement();

        new PopAnimator().popIn(element);
        expect(style.visibility).toBe('hidden');
        expect(style.scale).toBe('0');
        expect(style.transitionProperty).toBe('none');
        expect(classes.has('animate-popin')).toBe(false);

        observer.reveal(element);
        expect(style.visibility).toBe('');
        expect(style.scale).toBe('0');
        frames.advance();
        expect(classes.has('animate-popin')).toBe(false);

        frames.advance();
        expect(classes.has('animate-popin')).toBe(true);
        expect(style.scale).toBe('');
    });

    it('stops observing a marker it has already revealed', () => {
        const observer = stubObserver();
        stubFrames();
        const {element} = makeElement();

        new PopAnimator().popIn(element);
        expect(observer.observed.has(element)).toBe(true);

        observer.reveal(element);
        expect(observer.observed.has(element)).toBe(false);
    });

    it('plays anyway once the wait runs out', () => {
        vi.useFakeTimers();
        stubObserver();
        const frames = stubFrames();
        const {element, classes} = makeElement();

        new PopAnimator().popIn(element);
        vi.advanceTimersByTime(REVEAL_TIMEOUT_MS - 1);
        expect(classes.has('animate-popin')).toBe(false);

        vi.advanceTimersByTime(1);
        frames.advance();
        frames.advance();
        expect(classes.has('animate-popin')).toBe(true);
    });

    it('falls back to the timeout when IntersectionObserver is unavailable', () => {
        vi.useFakeTimers();
        vi.stubGlobal('IntersectionObserver', undefined);
        const frames = stubFrames();
        const {element, classes, style} = makeElement();

        new PopAnimator().popIn(element);
        expect(style.visibility).toBe('hidden');

        vi.advanceTimersByTime(REVEAL_TIMEOUT_MS);
        frames.advance();
        frames.advance();
        expect(classes.has('animate-popin')).toBe(true);
    });

    it.each(['animationend', 'animationcancel'])('cleans up on %s', eventName => {
        const observer = stubObserver();
        const frames = stubFrames();
        const {element, classes, style} = makeElement();

        new PopAnimator().popIn(element);
        observer.reveal(element);
        frames.advance();
        frames.advance();
        expect(classes.has('animate-popin')).toBe(true);

        element.dispatchEvent(new Event(eventName));
        expect(classes.has('animate-popin')).toBe(false);
        expect(style.visibility).toBe('');
        expect(style.scale).toBe('');
        expect(style.transitionProperty).toBe('');
    });

    it('cancels a pending animation and allows another one', () => {
        const observer = stubObserver();
        const frames = stubFrames();
        const {element, classes, style} = makeElement();
        const animator = new PopAnimator();

        animator.popIn(element);
        observer.reveal(element);
        frames.advance();
        frames.advance();
        animator.cancel(element);
        expect(classes.has('animate-popin')).toBe(false);
        expect(style.visibility).toBe('');
        expect(style.scale).toBe('');
        expect(style.transitionProperty).toBe('');

        animator.popIn(element);
        observer.reveal(element);
        frames.advance();
        frames.advance();
        expect(classes.has('animate-popin')).toBe(true);
    });

    it('does not start more than one frame budget of animations at once', () => {
        const observer = stubObserver();
        const frames = stubFrames();
        const animator = new PopAnimator();
        const markers = Array.from({length: MAX_STARTS_PER_FRAME + 1}, makeElement);

        for (const {element} of markers) {
            animator.popIn(element);
            observer.reveal(element);
        }
        frames.advance();
        frames.advance();

        expect(markers.filter(({classes}) => classes.has('animate-popin'))).toHaveLength(
            MAX_STARTS_PER_FRAME,
        );

        frames.advance();
        expect(markers.at(-1)?.classes.has('animate-popin')).toBe(true);
    });

    it('drops the hold when cancelled before the marker is revealed', () => {
        vi.useFakeTimers();
        const observer = stubObserver();
        const {element, classes, style} = makeElement();
        const animator = new PopAnimator();

        animator.popIn(element);
        animator.cancel(element);
        expect(style.visibility).toBe('');
        expect(style.scale).toBe('');
        expect(observer.observed.has(element)).toBe(false);

        vi.advanceTimersByTime(REVEAL_TIMEOUT_MS);
        expect(classes.has('animate-popin')).toBe(false);
    });

    it('cancels a revealed marker before its animation starts', () => {
        const observer = stubObserver();
        const frames = stubFrames();
        const {element, classes, style} = makeElement();
        const animator = new PopAnimator();

        animator.popIn(element);
        observer.reveal(element);
        animator.cancel(element);
        frames.advance();
        frames.advance();

        expect(classes.has('animate-popin')).toBe(false);
        expect(style.scale).toBe('');
    });

    it('keeps the pipeline busy until pop-in finishes', () => {
        const observer = stubObserver();
        const frames = stubFrames();
        const {element} = makeElement();

        new PopAnimator().popIn(element);
        expect(markerLifecycle.isIdle).toBe(false);

        observer.reveal(element);
        frames.advance();
        frames.advance();
        element.dispatchEvent(new Event('animationend'));
        expect(markerLifecycle.isIdle).toBe(true);
    });

    it('plays pop-out until animationend', () => {
        const {element, classes} = makeElement();
        const onDone = vi.fn();

        new PopAnimator().popOut(element, onDone);
        expect(classes.has('animate-popout')).toBe(true);
        expect(markerLifecycle.isIdle).toBe(false);

        element.dispatchEvent(new Event('animationend'));
        expect(classes.has('animate-popout')).toBe(false);
        expect(onDone).toHaveBeenCalledOnce();
        expect(markerLifecycle.isIdle).toBe(true);
    });

    it('finishes pop-out via the fallback timer', () => {
        vi.useFakeTimers();
        const {element, classes} = makeElement();
        const onDone = vi.fn();

        new PopAnimator().popOut(element, onDone);
        vi.advanceTimersByTime(POP_OUT_FALLBACK_MS);

        expect(classes.has('animate-popout')).toBe(false);
        expect(onDone).toHaveBeenCalledOnce();
        expect(markerLifecycle.isIdle).toBe(true);
    });
});
