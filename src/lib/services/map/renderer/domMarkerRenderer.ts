import type {MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {DragController} from '$lib/services/map/renderer/dom/dragController';
import {Factory} from '$lib/services/map/renderer/dom/factory';
import {applyMarkerAppearance} from '$lib/services/map/renderer/dom/markerAppearance.svelte';
import {PopAnimator} from '$lib/services/map/renderer/dom/popAnimation';
import {RevealWatcher} from '$lib/services/map/renderer/dom/revealWatcher';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';

export class DomMarkerRenderer implements MarkerRenderer {
    private factory: Factory;
    private dragController: DragController;
    private popAnimator = new PopAnimator();
    private reveals = new RevealWatcher();
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

    /** Shows a marker without the pop animation, which would blank it mid-gesture. */
    public reveal(marker: Marker, onRevealed?: () => void): void {
        this.applyState(marker);
        marker.show();
        const element = marker.getHandle()?.getElement();
        if (element && onRevealed) {
            this.reveals.watch(element, onRevealed);
        }
    }

    /** Starts a drag on a marker that was pressed elsewhere, e.g. handed over from the GPU renderer. */
    public beginDrag(marker: Marker): void {
        this.dragController.startDrag(marker);
    }

    public endDrag(marker: Marker): void {
        this.dragController.endDrag(marker);
    }

    public applyState(marker: Marker): void {
        applyMarkerAppearance(marker);
    }

    public destroy(): void {
        // No global resources to clean for DOM markers
    }
}
