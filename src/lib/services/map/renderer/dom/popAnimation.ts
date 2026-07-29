const POP_IN_CLASS = 'animate-popin';

export class PopAnimator {
    private active = new WeakMap<HTMLElement, () => void>();

    public popIn(element: HTMLElement): void {
        if (this.active.has(element)) {
            return;
        }

        const cleanup = (event?: AnimationEvent) => {
            if (event && event.target !== element) {
                return;
            }

            this.active.delete(element);
            element.removeEventListener('animationend', cleanup);
            element.removeEventListener('animationcancel', cleanup);
            element.classList.remove(POP_IN_CLASS);
        };

        // Google Maps may render the element much later, so only the animation's
        // own lifecycle reliably tells us when the class can be removed.
        this.active.set(element, cleanup);
        element.addEventListener('animationend', cleanup);
        element.addEventListener('animationcancel', cleanup);
        element.classList.add(POP_IN_CLASS);
    }

    public cancel(element: HTMLElement): void {
        this.active.get(element)?.();
    }
}
