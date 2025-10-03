import type { MarkerId } from '$lib/interfaces/marker';
import type {MarkerRepository} from './markerRepository';
import type {MarkerRenderer} from './renderer/markerRenderer';

export class VisibilityEngine {
    private suppressed = false;

    public constructor(
        private repo: MarkerRepository,
        private options: {chunkSize: number},
        private renderer: MarkerRenderer,
    ) {}

    public setRenderer(renderer: MarkerRenderer) {
        this.renderer = renderer;
    }

    public setSuppressed(value: boolean) {
        this.suppressed = value;
    }

    public updateVisibility(visibleIds: Set<string>, onComplete?: () => void) {
        const allMarkerIds = this.repo.ids();
        let currentIndex = 0;

        const processChunk = () => {
            if (this.suppressed) {
                if (onComplete) {
                    onComplete();
                }
                return;
            }

            const endIndex = Math.min(currentIndex + this.options.chunkSize, allMarkerIds.length);

            for (let i = currentIndex; i < endIndex; i++) {
                if (this.suppressed) {
                    if (onComplete) {
                        onComplete();
                    }
                    return;
                }

                const id = allMarkerIds[i];
                const shouldBeVisible = visibleIds.has(id);
                const isVisible = this.repo.isVisible(id);

                if (shouldBeVisible && !isVisible) {
                    this.show(id);
                } else if (!shouldBeVisible && isVisible) {
                    this.hide(id);
                }
            }

            currentIndex = endIndex;

            if (currentIndex < allMarkerIds.length) {
                requestAnimationFrame(processChunk);
            } else if (onComplete) {
                onComplete();
            }
        };

        requestAnimationFrame(processChunk);
    }

    public show(id: MarkerId) {
        const marker = this.repo.get(id);
        if (!marker) {
            return;
        }

        this.renderer.ensureCreated(marker);
        this.renderer.show(marker);
        this.repo.markVisible(id);
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
