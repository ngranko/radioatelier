import type {Marker} from '$lib/services/map/marker';
import {DragController} from '$lib/services/map/renderer/dom/dragController';
import {Factory} from '$lib/services/map/renderer/dom/factory';
import {Styler} from '$lib/services/map/renderer/dom/styler';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';

export class DomMarkerRenderer implements MarkerRenderer {
    private factory = new Factory();
    private dragController = new DragController();
    private styler = new Styler();
    private pendingRemoval = new WeakSet<Marker>();
    private pendingShow = new WeakSet<Marker>();

    public ensureCreated(marker: Marker): void {
        if (!marker.isCreated()) {
            this.factory.create(marker);
            this.dragController.attach(marker);
            this.applyState(marker);
        }
    }

    public syncAll(): void {
        // No-op; DOM markers are created on demand
    }

    public show(marker: Marker): void {
        const raw = marker.getRaw();
        if (!raw) {
            return;
        }

        this.applyState(marker);
        marker.show();

        if (this.pendingShow.has(marker)) {
            return;
        }
        this.pendingShow.add(marker);

        const element = raw.content as HTMLElement;
        element.classList.add('animate-popin');
        setTimeout(() => {
            this.pendingShow.delete(marker);
            element.classList.remove('animate-popin');
        }, 200);
    }

    public hide(marker: Marker): void {
        const raw = marker.getRaw();
        if (raw) {
            this.pendingShow.delete(marker);
            (raw.content as HTMLElement).classList.remove('animate-popin');
        }
        marker.hide();
    }

    public remove(marker: Marker, onRemoved?: () => void): void {
        const raw = marker.getRaw();
        if (!raw) {
            onRemoved?.();
            return;
        }

        if (this.pendingRemoval.has(marker)) {
            return;
        }
        this.pendingRemoval.add(marker);

        const element = raw.content as HTMLElement;
        element.classList.add('animate-popout');
        setTimeout(() => {
            this.pendingRemoval.delete(marker);
            element.classList.remove('animate-popout');
            this.dragController.detach(marker);
            marker.remove(() => onRemoved?.());
        }, 200);
    }

    public applyState(marker: Marker): void {
        this.styler.apply(marker);
    }

    public destroy(): void {
        // No global resources to clean for DOM markers
    }
}
