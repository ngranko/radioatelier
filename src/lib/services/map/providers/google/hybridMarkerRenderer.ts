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
        if (!('getGoogleMap' in provider) || typeof provider.getGoogleMap !== 'function') {
            throw new Error('HybridMarkerRenderer requires a GoogleMapsProvider');
        }
        const googleMap = (provider as GoogleMapsProvider).getGoogleMap();
        if (!googleMap) {
            throw new Error('GoogleMapsProvider map not initialized');
        }
        this.deck = new DeckOverlayRenderer(googleMap);
    }

    public ensureCreated(marker: Marker): void {
        this.rendererFor(marker).ensureCreated(marker);
    }

    public syncAll(iterable: Iterable<Marker>): void {
        const deckMarkers: Marker[] = [];
        for (const marker of iterable) {
            if (marker.usesDomRenderer()) {
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
        this.rendererFor(marker).remove(marker, onRemoved);
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
        return marker.usesDomRenderer() ? this.dom : this.deck;
    }
}
