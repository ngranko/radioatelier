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

    // Work is derived by diffing against the currently visible set, so a pass costs
    // what actually changed rather than a walk over the whole catalog.
    public updateVisibility(visibleIds: ReadonlySet<MarkerId>, onComplete?: () => void) {
        const currentVisibleIds = this.repo.visibleIds();
        const leaving = difference(currentVisibleIds, visibleIds);
        const entering = difference(visibleIds, currentVisibleIds);

        this.applyChanges(leaving, entering, onComplete);
    }

    private applyChanges(leaving: MarkerId[], entering: MarkerId[], onComplete?: () => void) {
        const total = leaving.length + entering.length;
        let cursor = 0;

        const step = () => {
            cursor = this.runBatch(leaving, entering, cursor);

            if (cursor < total && !this.suppressed) {
                requestAnimationFrame(step);
                return;
            }

            onComplete?.();
        };

        step();
    }

    // Batches are bounded by elapsed time rather than a marker count so that slow
    // devices yield to the browser often enough to stay responsive, while fast ones
    // land the entire diff in the first (synchronous) pass with no visible delay.
    private runBatch(leaving: MarkerId[], entering: MarkerId[], from: number): number {
        const total = leaving.length + entering.length;
        const deadline = performance.now() + this.options.frameBudgetMs;
        let cursor = from;

        while (cursor < total && !this.suppressed) {
            if (cursor < leaving.length) {
                this.hide(leaving[cursor]);
            } else {
                this.show(entering[cursor - leaving.length]);
            }
            cursor++;

            if (performance.now() >= deadline) {
                break;
            }
        }

        return cursor;
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
