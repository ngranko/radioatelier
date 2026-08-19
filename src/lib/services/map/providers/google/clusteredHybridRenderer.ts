import type {MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {
    isMarkerClusteringEnabled,
    subscribeMarkerClustering,
} from '$lib/services/map/markerClustering';
import {onFocusedMarkerChange} from '$lib/services/map/markerFocus';
import type {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
import {ClusteredMarkerRenderer} from '$lib/services/map/renderer/clustered/clusteredMarkerRenderer';
import {SpriteDragGesture} from '$lib/services/map/renderer/clustered/spriteDragGesture';
import {DomMarkerRenderer} from '$lib/services/map/renderer/domMarkerRenderer';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';

export class ClusteredHybridRenderer implements MarkerRenderer {
    private dom: DomMarkerRenderer;
    private clustered: ClusteredMarkerRenderer;
    private promoted?: Marker;
    private focused?: Marker;
    private dragging?: Marker;
    private dragGesture?: SpriteDragGesture;
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
        this.unsubscribeFocus = onFocusedMarkerChange(marker => {
            this.focused = marker;
            this.promote(marker);
        });
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
        this.dragGesture?.detach();
        this.unsubscribeClustering();
        this.unsubscribeFocus();
        this.dom.destroy();
        this.clustered.destroy();
    }

    private rendererFor(marker: Marker): MarkerRenderer {
        return marker.usesDomRenderer() || marker === this.promoted ? this.dom : this.clustered;
    }

    private promote(marker: Marker | undefined, animatePop = true): void {
        if (this.promoted && this.promoted !== marker) {
            this.dom.hide(this.promoted);
        }

        this.promoted = marker && !marker.usesDomRenderer() ? marker : undefined;
        this.clustered.setExcludedMarker(this.promoted);
        if (!this.promoted) {
            return;
        }

        this.dom.ensureCreated(this.promoted);
        if (animatePop) {
            this.dom.show(this.promoted);
            return;
        }
        // Mid-gesture the pop animation would blank the marker it is handing over.
        this.dom.reveal(this.promoted);
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

    /** A held sprite becomes a DOM marker so the existing drag controller can move it. */
    private startDrag(marker: Marker): void {
        if (this.promoted !== marker) {
            this.promote(marker, false);
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
        if (this.promoted !== this.focused) {
            this.promote(this.focused);
        }
    }
}
