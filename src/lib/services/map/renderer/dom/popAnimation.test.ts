import {afterEach, describe, expect, it, vi} from 'vitest';
import {PopAnimator} from './popAnimation';

function makeElement(visible = true) {
    const element = new EventTarget();
    const classes = new Set<string>();
    const style: Record<string, string> = {scale: ''};
    const state = {visible};
    Object.assign(element, {
        classList: {
            add: (className: string) => void classes.add(className),
            remove: (className: string) => void classes.delete(className),
        },
        style,
        checkVisibility: () => state.visible,
    });
    return {element: element as unknown as HTMLElement, classes, style, state};
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
        advance(count = 1) {
            for (let i = 0; i < count; i++) {
                const next = pending.entries().next();
                if (next.done) {
                    return;
                }
                const [id, callback] = next.value;
                pending.delete(id);
                callback(0);
            }
        },
    };
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('PopAnimator', () => {
    it('holds the marker at zero scale until the map reveals it', () => {
        const frames = stubFrames();
        const {element, classes, style, state} = makeElement(false);

        new PopAnimator().popIn(element);
        expect(style.scale).toBe('0');

        frames.advance(3);
        expect(classes.has('animate-popin')).toBe(false);

        state.visible = true;
        frames.advance();
        expect(classes.has('animate-popin')).toBe(true);
    });

    it('plays anyway once the wait runs out', () => {
        const frames = stubFrames();
        const {element, classes} = makeElement(false);

        new PopAnimator().popIn(element);
        frames.advance(40);

        expect(classes.has('animate-popin')).toBe(true);
    });

    it('plays on the next frame when checkVisibility is unavailable', () => {
        const frames = stubFrames();
        const {element, classes, style} = makeElement();
        Reflect.deleteProperty(element, 'checkVisibility');

        new PopAnimator().popIn(element);
        expect(style.scale).toBe('0');
        expect(classes.has('animate-popin')).toBe(false);

        frames.advance();
        expect(classes.has('animate-popin')).toBe(true);
    });

    it.each(['animationend', 'animationcancel'])('cleans up on %s', eventName => {
        const frames = stubFrames();
        const {element, classes, style} = makeElement();

        new PopAnimator().popIn(element);
        frames.advance();
        expect(classes.has('animate-popin')).toBe(true);

        element.dispatchEvent(new Event(eventName));
        expect(classes.has('animate-popin')).toBe(false);
        expect(style.scale).toBe('');
    });

    it('cancels a pending animation and allows another one', () => {
        const frames = stubFrames();
        const {element, classes, style} = makeElement();
        const animator = new PopAnimator();

        animator.popIn(element);
        frames.advance();
        animator.cancel(element);
        expect(classes.has('animate-popin')).toBe(false);
        expect(style.scale).toBe('');

        animator.popIn(element);
        frames.advance();
        expect(classes.has('animate-popin')).toBe(true);
    });

    it('drops the hold when cancelled before the marker is revealed', () => {
        const frames = stubFrames();
        const {element, classes, style} = makeElement(false);
        const animator = new PopAnimator();

        animator.popIn(element);
        animator.cancel(element);
        expect(style.scale).toBe('');

        frames.advance(5);
        expect(classes.has('animate-popin')).toBe(false);
    });
});
