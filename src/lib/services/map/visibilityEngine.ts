import type {MarkerId} from '$lib/interfaces/marker';
import type {Marker} from './marker';
import type {MarkerRepository} from './markerRepository';
import type {MarkerRenderer} from './renderer/markerRenderer';

export interface VisibilityEngineOptions {
    chunkSize: number;
    // Notification only — what happens when a marker becomes visible
    // (e.g. focusing the shared Object's marker) is the caller's policy.
    onShown?: (id: MarkerId, marker: Marker) => void;
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

    public updateVisibility(visibleIds: Set<string>, onComplete?: () => void) {
        this.cancelActiveUpdate?.();

        const markerIds = this.collectChanges(visibleIds);
        let currentIndex = 0;
        let completed = false;

        const complete = () => {
            if (completed) {
                return;
            }
            completed = true;
            this.cancelActiveUpdate = undefined;
            onComplete?.();
        };
        this.cancelActiveUpdate = complete;

        const processChunk = () => {
            if (completed) {
                return;
            }
            if (this.suppressed) {
                complete();
                return;
            }

            const endIndex = Math.min(currentIndex + this.options.chunkSize, markerIds.length);

            for (let i = currentIndex; i < endIndex; i++) {
                if (this.suppressed) {
                    complete();
                    return;
                }

                const id = markerIds[i];
                const shouldBeVisible = visibleIds.has(id);

                if (shouldBeVisible) {
                    this.show(id);
                } else {
                    this.hide(id);
                }
            }

            currentIndex = endIndex;

            if (currentIndex < markerIds.length) {
                requestAnimationFrame(processChunk);
            } else {
                complete();
            }
        };

        if (markerIds.length === 0) {
            complete();
        } else {
            requestAnimationFrame(processChunk);
        }
    }

    public cancelUpdate() {
        this.cancelActiveUpdate?.();
    }

    private collectChanges(visibleIds: Set<string>): MarkerId[] {
        const leaving = this.repo.getVisibleIds().filter(id => !visibleIds.has(id));
        const entering = [...visibleIds].filter(id => !this.repo.isVisible(id));
        return [...leaving, ...entering];
    }

    public show(id: MarkerId) {
        const marker = this.repo.get(id);
        if (!marker) {
            return;
        }

        this.renderer.ensureCreated(marker);
        this.renderer.show(marker);
        this.repo.markVisible(id);
        this.options.onShown?.(id, marker);
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
