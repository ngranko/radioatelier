import type {IMapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {DragController} from '$lib/services/map/renderer/dom/dragController';
import {Factory} from '$lib/services/map/renderer/dom/factory';
import {Styler} from '$lib/services/map/renderer/dom/styler';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';

export class DomMarkerRenderer implements MarkerRenderer {
    private factory: Factory;
    private dragController: DragController;
    private styler = new Styler();

    public constructor(provider: IMapProvider) {
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
        const element = marker.getHandle()?.getElement();
        if (!element) {
            onRemoved?.();
            return;
        }

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
