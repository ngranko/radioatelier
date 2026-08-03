export const REVEAL_TIMEOUT_MS = 500;

interface PendingReveal {
    onRevealed: () => void;
    timeoutId: ReturnType<typeof setTimeout>;
}

// The Maps API attaches marker content to the map several frames before its draw pass gives
// the marker a screen position, and until then the element is painted far outside the
// viewport. `checkVisibility()` calls such a marker visible — it only reads display,
// visibility, opacity and content-visibility, never geometry — so anything gated on it
// starts while the marker is still parked off screen. Intersection geometry is the only
// signal that knows the difference, hence an observer rather than a per-frame poll.
// The timeout keeps a marker the map never places from waiting forever.
export class RevealWatcher {
    private pending = new Map<Element, PendingReveal>();
    private observer = createObserver(entries => this.onEntries(entries));

    public watch(element: Element, onRevealed: () => void): () => void {
        this.pending.set(element, {
            onRevealed,
            timeoutId: setTimeout(() => this.reveal(element), REVEAL_TIMEOUT_MS),
        });
        this.observer?.observe(element);

        return () => void this.drop(element);
    }

    private onEntries(entries: IntersectionObserverEntry[]): void {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                this.reveal(entry.target);
            }
        }
    }

    private reveal(element: Element): void {
        this.drop(element)?.onRevealed();
    }

    private drop(element: Element): PendingReveal | undefined {
        const reveal = this.pending.get(element);
        if (!reveal) {
            return undefined;
        }

        this.pending.delete(element);
        clearTimeout(reveal.timeoutId);
        this.observer?.unobserve(element);
        return reveal;
    }
}

function createObserver(callback: IntersectionObserverCallback): IntersectionObserver | undefined {
    return typeof IntersectionObserver === 'function'
        ? new IntersectionObserver(callback)
        : undefined;
}
