import {markerLifecycle} from '$lib/services/map/markerLifecycle';
import {RevealWatcher} from '$lib/services/map/renderer/dom/revealWatcher';

const POP_IN_CLASS = 'animate-popin';
const POP_OUT_CLASS = 'animate-popout';
export const MAX_STARTS_PER_FRAME = 32;
export const POP_OUT_FALLBACK_MS = 250;

export class PopAnimator {
    private running = new WeakMap<HTMLElement, () => void>();
    private reveals = new RevealWatcher();
    private waiting = new Set<HTMLElement>();
    private ready = new Set<HTMLElement>();
    private frameId?: number;

    public popIn(element: HTMLElement): void {
        if (this.running.has(element)) {
            return;
        }

        markerLifecycle.begin();
        element.style.visibility = 'hidden';
        element.style.transitionProperty = 'none';
        element.style.scale = '0';
        this.running.set(
            element,
            this.reveals.watch(element, () => this.queue(element)),
        );
    }

    public popOut(element: HTMLElement, onDone: () => void): void {
        this.cancel(element);
        markerLifecycle.begin();
        this.running.set(
            element,
            watchAnimationEnd(element, () => this.finish(element, onDone), POP_OUT_FALLBACK_MS),
        );
        element.classList.add(POP_OUT_CLASS);
    }

    public cancel(element: HTMLElement): void {
        if (!this.running.has(element)) {
            return;
        }
        this.finish(element);
    }

    private queue(element: HTMLElement): void {
        element.style.visibility = '';
        this.waiting.add(element);
        this.running.set(element, () => this.dropQueued(element));
        this.scheduleFrame();
    }

    private scheduleFrame(): void {
        if (this.frameId === undefined) {
            this.frameId = requestAnimationFrame(() => this.flushFrame());
        }
    }

    private flushFrame(): void {
        this.frameId = undefined;
        let starts = 0;
        // A painted zero-scale frame prevents a delayed first animation frame from
        // looking like a partial pop. Limiting starts also bounds layer promotion work.
        for (const element of this.ready) {
            this.ready.delete(element);
            this.play(element);
            if (++starts === MAX_STARTS_PER_FRAME) {
                break;
            }
        }

        for (const element of this.waiting) {
            this.ready.add(element);
        }
        this.waiting.clear();

        if (this.ready.size > 0) {
            this.scheduleFrame();
        }
    }

    private dropQueued(element: HTMLElement): void {
        this.waiting.delete(element);
        this.ready.delete(element);
    }

    private play(element: HTMLElement): void {
        const stop = watchAnimationEnd(element, () => this.finish(element));
        this.running.set(element, stop);
        element.classList.add(POP_IN_CLASS);
        element.style.scale = '';
    }

    private finish(element: HTMLElement, onDone?: () => void): void {
        const stop = this.running.get(element);
        if (!stop) {
            return;
        }

        this.running.delete(element);
        stop();
        this.clear(element);
        markerLifecycle.end();
        onDone?.();
    }

    private clear(element: HTMLElement): void {
        element.classList.remove(POP_IN_CLASS);
        element.classList.remove(POP_OUT_CLASS);
        element.style.visibility = '';
        element.style.transitionProperty = '';
        element.style.scale = '';
    }
}

function watchAnimationEnd(
    element: HTMLElement,
    onDone: () => void,
    fallbackMs?: number,
): () => void {
    const done = (event: AnimationEvent) => {
        if (event.target === element) {
            onDone();
        }
    };
    const fallback = fallbackMs === undefined ? undefined : setTimeout(onDone, fallbackMs);
    element.addEventListener('animationend', done);
    element.addEventListener('animationcancel', done);
    return () => {
        if (fallback !== undefined) {
            clearTimeout(fallback);
        }
        element.removeEventListener('animationend', done);
        element.removeEventListener('animationcancel', done);
    };
}
