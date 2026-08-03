import {RevealWatcher} from '$lib/services/map/renderer/dom/revealWatcher';

const POP_IN_CLASS = 'animate-popin';

export class PopAnimator {
    private running = new WeakMap<HTMLElement, () => void>();
    private reveals = new RevealWatcher();

    public popIn(element: HTMLElement): void {
        if (this.running.has(element)) {
            return;
        }

        // Held from the moment the marker is handed to the map: whatever the map does before
        // the animation may start, it must not paint the marker. Hiding rather than scaling
        // to zero leaves the element's box intact, which is what the reveal watcher measures,
        // and skips the marker's own transform transition that a scale write would trigger.
        element.style.visibility = 'hidden';
        this.running.set(
            element,
            this.reveals.watch(element, () => this.play(element)),
        );
    }

    public cancel(element: HTMLElement): void {
        const stop = this.running.get(element);
        if (!stop) {
            return;
        }

        this.running.delete(element);
        stop();
        this.clear(element);
    }

    private play(element: HTMLElement): void {
        const done = (event: AnimationEvent) => {
            if (event.target !== element) {
                return;
            }

            this.running.delete(element);
            stopListening();
            this.clear(element);
        };
        const stopListening = () => {
            element.removeEventListener('animationend', done);
            element.removeEventListener('animationcancel', done);
        };

        this.running.set(element, stopListening);
        element.addEventListener('animationend', done);
        element.addEventListener('animationcancel', done);
        // Revealing and starting the growth in the same style change is what keeps the map
        // from ever painting a frame of the marker at full size.
        element.style.visibility = '';
        element.classList.add(POP_IN_CLASS);
    }

    private clear(element: HTMLElement): void {
        element.classList.remove(POP_IN_CLASS);
        element.style.visibility = '';
    }
}
