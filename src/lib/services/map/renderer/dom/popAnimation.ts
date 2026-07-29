const STAGGER_STEP_MS = 12;
const STAGGER_CAP_MS = 180;
// Shows arrive in bursts a few frames apart while the visibility diff drains, so a
// gap this size is what separates one viewport update from the next.
const WAVE_GAP_MS = 100;

export class PopAnimator {
    private waveIndex = 0;
    private lastPlayedAt = 0;
    private active = new WeakMap<HTMLElement, () => void>();

    public popIn(element: HTMLElement): void {
        if (this.active.has(element)) {
            return;
        }

        element.style.animationDelay = `${this.nextDelay()}ms`;
        this.play(element, 'animate-popin');
    }

    public cancel(element: HTMLElement): void {
        this.active.get(element)?.();
    }

    private nextDelay(): number {
        const now = performance.now();
        if (now - this.lastPlayedAt > WAVE_GAP_MS) {
            this.waveIndex = 0;
        }
        this.lastPlayedAt = now;

        return Math.min(this.waveIndex++ * STAGGER_STEP_MS, STAGGER_CAP_MS);
    }

    // The Maps API renders marker content on its own draw pass, so the animation cannot
    // start on the tick the class lands — a wall-clock timer would strip it before it
    // ever plays. Its own end/cancel events fire whenever that draw actually happens.
    private play(element: HTMLElement, className: string): void {
        const cleanup = (event?: AnimationEvent) => {
            if (event && event.target !== element) {
                return;
            }

            this.active.delete(element);
            element.removeEventListener('animationend', cleanup);
            element.removeEventListener('animationcancel', cleanup);
            element.classList.remove(className);
            element.style.animationDelay = '';
        };

        this.active.set(element, cleanup);
        element.addEventListener('animationend', cleanup);
        element.addEventListener('animationcancel', cleanup);
        element.classList.add(className);
    }
}
