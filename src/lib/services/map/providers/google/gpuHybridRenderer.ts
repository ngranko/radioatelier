import type {MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {onFocusedMarkerChange} from '$lib/services/map/markerFocus';
import {markerLifecycle} from '$lib/services/map/markerLifecycle';
import type {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
import {DomMarkerRenderer} from '$lib/services/map/renderer/domMarkerRenderer';
import {GpuMarkerRenderer} from '$lib/services/map/renderer/gpu/gpuMarkerRenderer';
import {SpriteDragGesture} from '$lib/services/map/renderer/gpu/spriteDragGesture';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';

// Long enough for the focus highlight to scale back down (duration-100) before the sprite returns:
// two identical markers on screen at once would composite their translucent halos into a dark ring.
const HIGHLIGHT_EXIT_MS = 140;

export class GpuHybridRenderer implements MarkerRenderer {
    private dom: DomMarkerRenderer;
    private gpu: GpuMarkerRenderer;
    private promoted?: Marker;
    private dragging?: Marker;
    private dragGesture?: SpriteDragGesture;
    private retirements = new Map<Marker, ReturnType<typeof setTimeout>>();
    private destroyed = false;
    private unsubscribeFocus: () => void;

    public constructor(
        provider: MapProvider,
        private onInteraction: () => void,
    ) {
        this.dom = new DomMarkerRenderer(provider);
        if (!('getDeckOverlay' in provider) || typeof provider.getDeckOverlay !== 'function') {
            throw new Error('GpuHybridRenderer requires a GoogleMapsProvider');
        }

        const overlay = (provider as GoogleMapsProvider).getDeckOverlay();

        this.gpu = new GpuMarkerRenderer(overlay, onInteraction);
        this.unsubscribeFocus = onFocusedMarkerChange(marker => {
            this.promote(marker);
        });
        this.attachDragGesture(provider as GoogleMapsProvider);
    }

    public ensureCreated(marker: Marker): void {
        this.rendererFor(marker).ensureCreated(marker);
    }

    public syncAll(iterable: Iterable<Marker>): void {
        const gpuMarkers: Marker[] = [];
        for (const marker of iterable) {
            if (marker.usesDomRenderer()) {
                this.dom.ensureCreated(marker);
            } else {
                gpuMarkers.push(marker);
            }
        }
        this.gpu.syncAll(gpuMarkers);
    }

    public show(marker: Marker): void {
        this.rendererFor(marker).show(marker);
    }

    public hide(marker: Marker): void {
        if (marker === this.promoted) {
            return;
        }
        this.rendererFor(marker).hide(marker);
    }

    public remove(marker: Marker, onRemoved?: () => void): void {
        if (marker === this.promoted) {
            this.promoted = undefined;
            this.dom.remove(marker, () => this.gpu.remove(marker, onRemoved));
            return;
        }
        this.rendererFor(marker).remove(marker, onRemoved);
    }

    public applyState(marker: Marker): void {
        if (!marker.usesDomRenderer()) {
            this.gpu.applyState(marker);
        }
        if (marker.usesDomRenderer() || marker === this.promoted) {
            this.dom.applyState(marker);
        }
    }

    public destroy(): void {
        this.destroyed = true;
        for (const timeout of this.retirements.values()) {
            clearTimeout(timeout);
        }
        this.retirements.clear();
        this.detachDragGesture();
        this.unsubscribeFocus();
        this.dom.destroy();
        this.gpu.destroy();
    }

    private rendererFor(marker: Marker): MarkerRenderer {
        return marker.usesDomRenderer() || marker === this.promoted ? this.dom : this.gpu;
    }

    private promote(marker: Marker | undefined): void {
        const previous = this.promoted;
        this.promoted = marker && !marker.usesDomRenderer() ? marker : undefined;
        if (this.promoted) {
            this.gpu.setExcludedMarker(this.promoted);
            this.dom.ensureCreated(this.promoted);
            // Deliberately not the pop animation: the marker is already on screen as a sprite, and
            // popping in from zero also pins an inline scale that the highlight cannot transition.
            this.dom.reveal(this.promoted);
        }
        if (previous && previous !== this.promoted) {
            this.retire(previous, this.promoted ? 0 : HIGHLIGHT_EXIT_MS);
        }
    }

    /** Hands a marker back to the GPU layer: sprite first, DOM twin only once that render landed. */
    private retire(marker: Marker, delayMs: number): void {
        clearTimeout(this.retirements.get(marker));
        const timeout = setTimeout(() => {
            this.retirements.delete(marker);
            if (this.promoted === marker) {
                return;
            }
            // Promotion already excluded whatever holds the slot now; a marker still on its way
            // out owns it until it lands, so only the last one standing hands the sprite back.
            if (!this.promoted && this.retirements.size === 0) {
                this.gpu.setExcludedMarker(undefined);
            }
            // Idle means the layers were handed to deck, not yet painted, hence the extra frame:
            // overlapping for one frame reads better than a frame with no marker at all.
            markerLifecycle.onNextIdle(() =>
                requestAnimationFrame(() => {
                    if (!this.destroyed && this.promoted !== marker) {
                        this.dom.hide(marker);
                    }
                }),
            );
        }, delayMs);
        this.retirements.set(marker, timeout);
    }

    private attachDragGesture(provider: GoogleMapsProvider): void {
        const container = provider.getGoogleMap()?.getDiv();
        if (!container) {
            return;
        }
        this.dragGesture = new SpriteDragGesture(container, provider.getDeckOverlay(), {
            onHold: marker => this.startDrag(marker),
            onRelease: () => this.endDrag(),
        });
        this.dragGesture.attach();
    }

    private detachDragGesture(): void {
        this.dragGesture?.detach();
        this.dragGesture = undefined;
    }

    /** A held sprite becomes a DOM marker so the existing drag controller can move it. */
    private startDrag(marker: Marker): void {
        if (this.promoted !== marker) {
            this.promote(marker);
        }
        this.dragging = marker;
        this.dom.beginDrag(marker);
    }

    private endDrag(): void {
        const marker = this.dragging;
        if (!marker) {
            return;
        }
        this.dragging = undefined;
        // The press began on the map, so the release can land outside the DOM marker's own 24px
        // box; ending the drag here rather than only from its element keeps the map draggable.
        this.dom.endDrag(marker);
        // The hold started on the map surface, so Maps reports a plain click on release; without
        // claiming it as a renderer interaction the map handler would drop a new object there.
        this.onInteraction();
        // The details overlay blocks map input until closed, so a sprite drag never shares
        // promotion with a focused marker; handing it back to GPU is always correct.
        this.promote(undefined);
    }
}
