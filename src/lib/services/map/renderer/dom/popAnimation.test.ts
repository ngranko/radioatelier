import {describe, expect, it} from 'vitest';
import {PopAnimator} from './popAnimation';

function makeElement() {
    const element = new EventTarget();
    const classes = new Set<string>();
    Object.assign(element, {
        classList: {
            add: (className: string) => void classes.add(className),
            remove: (className: string) => void classes.delete(className),
        },
    });
    return {element: element as unknown as HTMLElement, classes};
}

describe('PopAnimator', () => {
    it.each(['animationend', 'animationcancel'])('cleans up on %s', eventName => {
        const animator = new PopAnimator();
        const {element, classes} = makeElement();

        animator.popIn(element);
        expect(classes.has('animate-popin')).toBe(true);

        element.dispatchEvent(new Event(eventName));
        expect(classes.has('animate-popin')).toBe(false);
    });

    it('cancels a pending animation and allows another one', () => {
        const animator = new PopAnimator();
        const {element, classes} = makeElement();

        animator.popIn(element);
        animator.cancel(element);
        expect(classes.has('animate-popin')).toBe(false);

        animator.popIn(element);
        expect(classes.has('animate-popin')).toBe(true);
    });
});
