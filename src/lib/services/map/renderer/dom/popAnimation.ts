const POP_IN_CLASS = 'animate-popin';
const MAX_WAIT_FRAMES = 30;

export class PopAnimator {
    private running = new WeakMap<HTMLElement, () => void>();

    public popIn(element: HTMLElement): void {
        if (this.running.has(element)) {
            return;
        }

        // Held from the moment the marker is handed to the map: whatever the map does
        // before the animation may start, it must not paint the marker at full size.
        element.style.scale = '0';
        this.running.set(
            element,
            whenVisible(element, () => this.play(element)),
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
        element.classList.add(POP_IN_CLASS);
    }

    private clear(element: HTMLElement): void {
        element.classList.remove(POP_IN_CLASS);
        element.style.scale = '';
    }
}

// A CSS animation starts as soon as its element is rendered and then advances on
// wall-clock time, while the map reveals marker content on its own draw pass and can
// stall a frame behind a long task. Starting on a frame where the marker is actually
// visible is what keeps its growth from playing where nobody can see it — leaving only
// the overshoot on screen. Giving up after MAX_WAIT_FRAMES rather than waiting forever
// keeps a marker the map never reveals from staying stuck at zero scale.
function whenVisible(element: HTMLElement, onVisible: () => void): () => void {
    let frames = 0;
    let frameId = requestAnimationFrame(function poll() {
        const visible = element.checkVisibility({
            visibilityProperty: true,
            opacityProperty: true,
            contentVisibilityAuto: true,
        });

        if (visible || ++frames > MAX_WAIT_FRAMES) {
            onVisible();
            return;
        }

        frameId = requestAnimationFrame(poll);
    });

    return () => cancelAnimationFrame(frameId);
}
