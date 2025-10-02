import type {Marker} from '$lib/services/map/marker';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';
import { Styler } from '$lib/services/map/renderer/dom/styler';
import { Factory } from '$lib/services/map/renderer/dom/factory';
import { DragController } from '$lib/services/map/renderer/dom/dragController';

export class DomMarkerRenderer implements MarkerRenderer {
    private factory = new Factory();
    private dragController = new DragController();
    private styler = new Styler();

    public ensureCreated(marker: Marker): void {
        if (!marker.isCreated()) {
            this.factory.create(marker);
            this.dragController.attach(marker);
            this.applyState(marker);
        }
    }

    public syncAll(iterable: Iterable<Marker>): void {
        // No-op; DOM markers are created on demand
    }

    public show(marker: Marker): void {
        const raw = marker.getRaw();
        if (!raw) {
            return;
        }

        this.applyState(marker);
        const element = raw.content as HTMLElement;
        element.classList.add('animate-popin');
        setTimeout(() => {
            element.classList.remove('animate-popin');
        }, 200);
        
        marker.show();
    }

    public hide(marker: Marker): void {
        marker.hide();
    }

    public remove(marker: Marker, onRemoved?: () => void): void {
        const raw = marker.getRaw();
        if (!raw) {
            onRemoved?.();
            return;
        }
        
        const element = raw.content as HTMLElement;
        element.classList.add('animate-popout');
        setTimeout(() => {
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
