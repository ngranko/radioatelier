import type {MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {DeckOverlayRenderer} from '$lib/services/map/providers/google/deckOverlayRenderer';
import type {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
import {DomMarkerRenderer} from '$lib/services/map/renderer/domMarkerRenderer';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';

export class HybridMarkerRenderer implements MarkerRenderer {
    private dom: DomMarkerRenderer;
    private deck: DeckOverlayRenderer;

    public constructor(provider: MapProvider) {
        this.dom = new DomMarkerRenderer(provider);
        if (!('getDeckOverlay' in provider) || typeof provider.getDeckOverlay !== 'function') {
            throw new Error('HybridMarkerRenderer requires a GoogleMapsProvider');
        }
        this.deck = new DeckOverlayRenderer((provider as GoogleMapsProvider).getDeckOverlay());
    }

    public ensureCreated(marker: Marker): void {
        this.rendererFor(marker).ensureCreated(marker);
    }

    public syncAll(iterable: Iterable<Marker>): void {
        const deckMarkers: Marker[] = [];
        for (const marker of iterable) {
            if (marker.isServiceMarker()) {
                this.dom.ensureCreated(marker);
            } else {
                deckMarkers.push(marker);
            }
        }
        this.deck.syncAll(deckMarkers);
    }

    public show(marker: Marker): void {
        this.rendererFor(marker).show(marker);
    }

    public hide(marker: Marker): void {
        this.rendererFor(marker).hide(marker);
    }

    public remove(marker: Marker, onRemoved?: () => void): void {
        // List pins keep a hidden DOM handle across deck switches; dropping
        // only the scatterplot entry would leak that AdvancedMarkerElement.
        this.deck.remove(marker);
        this.dom.remove(marker, onRemoved);
    }

    public applyState(marker: Marker): void {
        this.rendererFor(marker).applyState(marker);
    }

    public destroy(): void {
        try {
            this.dom.destroy();
        } catch (e) {
            console.error('error destroying DomMarkerRenderer:', e);
        }
        try {
            this.deck.destroy();
        } catch (e) {
            console.error('error destroying DeckOverlayRenderer:', e);
        }
    }

    private rendererFor(marker: Marker): MarkerRenderer {
        return marker.isServiceMarker() ? this.dom : this.deck;
    }
}
