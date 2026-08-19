import type {MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {
    isMarkerClusteringEnabled,
    subscribeMarkerClustering,
} from '$lib/services/map/markerClustering';
import {onFocusedMarkerChange} from '$lib/services/map/markerFocus';
import {markerLifecycle} from '$lib/services/map/markerLifecycle';
import type {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
import {ClusteredMarkerRenderer} from '$lib/services/map/renderer/clustered/clusteredMarkerRenderer';
import {SpriteDragGesture} from '$lib/services/map/renderer/clustered/spriteDragGesture';
import {DomMarkerRenderer} from '$lib/services/map/renderer/domMarkerRenderer';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';

// Long enough for the focus highlight to scale back down (duration-100) before the sprite returns:
// two identical markers on screen at once would composite their translucent halos into a dark ring.
const HIGHLIGHT_EXIT_MS = 140;

export class ClusteredHybridRenderer implements MarkerRenderer {
    private dom: DomMarkerRenderer;
    private clustered: ClusteredMarkerRenderer;
    private promoted?: Marker;
    private dragging?: Marker;
    private dragGesture?: SpriteDragGesture;
    private retireTimeout?: ReturnType<typeof setTimeout>;
    private unsubscribeClustering: () => void;
    private unsubscribeFocus: () => void;

    public constructor(
        provider: MapProvider,
        private onInteraction: () => void,
    ) {
        this.dom = new DomMarkerRenderer(provider);
        if (!('getDeckOverlay' in provider) || typeof provider.getDeckOverlay !== 'function') {
            throw new Error('ClusteredHybridRenderer requires a GoogleMapsProvider');
        }
        const overlay = (provider as GoogleMapsProvider).getDeckOverlay();
        this.clustered = new ClusteredMarkerRenderer(
            provider,
            overlay,
            onInteraction,
            isMarkerClusteringEnabled(),
        );
        this.unsubscribeClustering = subscribeMarkerClustering(enabled => {
            this.clustered.setClusteringEnabled(enabled);
        });
        this.unsubscribeFocus = onFocusedMarkerChange(marker => this.promote(marker));
        this.attachDragGesture(provider as GoogleMapsProvider);
    }

    public ensureCreated(marker: Marker): void {
        this.rendererFor(marker).ensureCreated(marker);
    }

    public syncAll(iterable: Iterable<Marker>): void {
        const clusteredMarkers: Marker[] = [];
        for (const marker of iterable) {
            if (marker.usesDomRenderer()) {
                this.dom.ensureCreated(marker);
            } else {
                clusteredMarkers.push(marker);
            }
        }
        this.clustered.syncAll(clusteredMarkers);
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
            this.dom.remove(marker, () => this.clustered.remove(marker, onRemoved));
            return;
        }
        this.rendererFor(marker).remove(marker, onRemoved);
    }

    public applyState(marker: Marker): void {
        if (!marker.usesDomRenderer()) {
            this.clustered.applyState(marker);
        }
        if (marker.usesDomRenderer() || marker === this.promoted) {
            this.dom.applyState(marker);
        }
    }

    public destroy(): void {
        clearTimeout(this.retireTimeout);
        this.detachDragGesture();
        this.unsubscribeClustering();
        this.unsubscribeFocus();
        this.dom.destroy();
        this.clustered.destroy();
    }

    private rendererFor(marker: Marker): MarkerRenderer {
        return marker.usesDomRenderer() || marker === this.promoted ? this.dom : this.clustered;
    }

    private promote(marker: Marker | undefined): void {
        const previous = this.promoted;
        this.promoted = marker && !marker.usesDomRenderer() ? marker : undefined;
        if (this.promoted) {
            this.clustered.setExcludedMarker(this.promoted);
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
        clearTimeout(this.retireTimeout);
        this.retireTimeout = setTimeout(() => {
            if (this.promoted === marker) {
                return;
            }
            this.clustered.setExcludedMarker(this.promoted);
            // Idle means the layers were handed to deck, not yet painted, hence the extra frame:
            // overlapping for one frame reads better than a frame with no marker at all.
            markerLifecycle.onNextIdle(() =>
                requestAnimationFrame(() => {
                    if (this.promoted !== marker) {
                        this.dom.hide(marker);
                    }
                }),
            );
        }, delayMs);
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
