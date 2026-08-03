import type {MarkerId} from '$lib/interfaces/marker';
import type {Marker} from './marker';
import type {MarkerRepository} from './markerRepository';
import type {MarkerRenderer} from './renderer/markerRenderer';

export interface VisibilityEngineOptions {
    frameBudgetMs: number;
    // Notification only — what happens when a marker becomes visible
    // (e.g. focusing the shared Object's marker) is the caller's policy.
    onShown?: (marker: Marker) => void;
}

export class VisibilityEngine {
    private suppressed = false;
    private cancelActiveUpdate?: () => void;

    public constructor(
        private repo: MarkerRepository,
        private options: VisibilityEngineOptions,
        private renderer: MarkerRenderer,
    ) {}

    public setRenderer(renderer: MarkerRenderer) {
        this.renderer = renderer;
    }

    public setSuppressed(value: boolean) {
        this.suppressed = value;
    }

    // Drop any queued requestAnimationFrame batch so it cannot resume against a
    // renderer that was swapped out (or a newer visibility target) after suppress.
    public cancelPending(): void {
        this.cancelActiveUpdate?.();
    }

    // Work is derived by diffing against the currently visible set, so a pass costs
    // what actually changed rather than a walk over the whole catalog.
    public updateVisibility(visibleIds: ReadonlySet<MarkerId>, onComplete?: () => void) {
        this.cancelPending();

        const currentVisibleIds = this.repo.visibleIds();
        const leaving = difference(currentVisibleIds, visibleIds);
        const entering = difference(visibleIds, currentVisibleIds);

        if (leaving.length === 0 && entering.length === 0) {
            onComplete?.();
            return;
        }

        this.applyChanges(leaving, entering, onComplete);
    }

    // Batches are bounded by elapsed time rather than a marker count so that slow
    // devices yield to the browser often enough to stay responsive, while fast ones
    // land the entire diff in the first (synchronous) pass with no visible delay.
    private applyChanges(leaving: MarkerId[], entering: MarkerId[], onComplete?: () => void) {
        // One queue keeps the time-budgeted cursor trivial: hides first, then shows.
        const hideCount = leaving.length;
        const queue = leaving.concat(entering);

        let cursor = 0;
        let frameId = 0;
        let completed = false;

        const finish = () => {
            if (completed) {
                return;
            }
            completed = true;
            cancelAnimationFrame(frameId);
            this.cancelActiveUpdate = undefined;
            onComplete?.();
        };
        this.cancelActiveUpdate = finish;

        const step = () => {
            if (completed) {
                return;
            }

            const deadline = performance.now() + this.options.frameBudgetMs;
            while (cursor < queue.length && !this.suppressed) {
                if (cursor < hideCount) {
                    this.hide(queue[cursor]);
                } else {
                    this.show(queue[cursor]);
                }
                cursor++;

                if (performance.now() >= deadline) {
                    break;
                }
            }

            if (cursor < queue.length && !this.suppressed) {
                frameId = requestAnimationFrame(step);
                return;
            }

            finish();
        };

        step();
    }

    public show(id: MarkerId) {
        const marker = this.repo.get(id);
        if (!marker) {
            return;
        }

        this.renderer.ensureCreated(marker);
        this.renderer.show(marker);
        this.repo.markVisible(id);
        this.options.onShown?.(marker);
    }

    public hide(id: MarkerId) {
        this.repo.markHidden(id);

        const marker = this.repo.get(id);
        if (!marker) {
            return;
        }

        this.renderer.hide(marker);
    }
}

function difference(ids: Iterable<MarkerId>, excluded: ReadonlySet<MarkerId>): MarkerId[] {
    const remaining: MarkerId[] = [];
    for (const id of ids) {
        if (!excluded.has(id)) {
            remaining.push(id);
        }
    }
    return remaining;
}
