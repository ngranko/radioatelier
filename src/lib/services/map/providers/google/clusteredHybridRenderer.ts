import type {MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {onFocusedMarkerChange} from '$lib/services/map/markerFocus';
import type {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
import {ClusteredMarkerRenderer} from '$lib/services/map/renderer/clustered/clusteredMarkerRenderer';
import {DomMarkerRenderer} from '$lib/services/map/renderer/domMarkerRenderer';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';

export class ClusteredHybridRenderer implements MarkerRenderer {
    private dom: DomMarkerRenderer;
    private clustered: ClusteredMarkerRenderer;
    private promoted?: Marker;
    private unsubscribeFocus: () => void;

    public constructor(provider: MapProvider, onInteraction: () => void) {
        this.dom = new DomMarkerRenderer(provider);
        if (!('getDeckOverlay' in provider) || typeof provider.getDeckOverlay !== 'function') {
            throw new Error('ClusteredHybridRenderer requires a GoogleMapsProvider');
        }
        const overlay = (provider as GoogleMapsProvider).getDeckOverlay();
        this.clustered = new ClusteredMarkerRenderer(provider, overlay, onInteraction);
        this.unsubscribeFocus = onFocusedMarkerChange(marker => this.promote(marker));
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
        this.rendererFor(marker).hide(marker);
    }

    public remove(marker: Marker, onRemoved?: () => void): void {
        if (marker === this.promoted) {
            this.promoted = undefined;
            this.clustered.setExcludedMarker(undefined);
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
        this.unsubscribeFocus();
        this.dom.destroy();
        this.clustered.destroy();
    }

    private rendererFor(marker: Marker): MarkerRenderer {
        return marker.usesDomRenderer() || marker === this.promoted ? this.dom : this.clustered;
    }

    private promote(marker: Marker | undefined): void {
        if (this.promoted && this.promoted !== marker) {
            this.dom.hide(this.promoted);
        }

        this.promoted = marker && !marker.usesDomRenderer() ? marker : undefined;
        this.clustered.setExcludedMarker(this.promoted);
        if (!this.promoted) return;

        this.dom.ensureCreated(this.promoted);
        this.dom.show(this.promoted);
    }
}
