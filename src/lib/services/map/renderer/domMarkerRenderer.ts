import type {MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {DragController} from '$lib/services/map/renderer/dom/dragController';
import {Factory} from '$lib/services/map/renderer/dom/factory';
import {PopAnimator} from '$lib/services/map/renderer/dom/popAnimation';
import {Styler} from '$lib/services/map/renderer/dom/styler';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';

export class DomMarkerRenderer implements MarkerRenderer {
    private factory: Factory;
    private dragController: DragController;
    private styler = new Styler();
    private popAnimator = new PopAnimator();
    private pendingRemoval = new WeakSet<Marker>();

    public constructor(provider: MapProvider) {
        this.factory = new Factory(provider);
        this.dragController = new DragController(provider);
    }

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
        const element = marker.getHandle()?.getElement();
        if (!element) {
            return;
        }

        this.applyState(marker);
        this.popAnimator.popIn(element);
        marker.show();
    }

    public hide(marker: Marker): void {
        const element = marker.getHandle()?.getElement();
        if (element) {
            this.popAnimator.cancel(element);
        }
        marker.hide();
    }

    public remove(marker: Marker, onRemoved?: () => void): void {
        const element = marker.getHandle()?.getElement();
        if (!element) {
            onRemoved?.();
            return;
        }

        if (this.pendingRemoval.has(marker)) {
            return;
        }
        this.pendingRemoval.add(marker);

        this.popAnimator.popOut(element, () => {
            this.pendingRemoval.delete(marker);
            this.dragController.detach(marker);
            marker.remove(() => onRemoved?.());
        });
    }

    public applyState(marker: Marker): void {
        this.styler.apply(marker);
    }

    public destroy(): void {
        // No global resources to clean for DOM markers
    }
}
