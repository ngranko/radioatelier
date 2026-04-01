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
        if (marker.getSource() === 'search') {
            this.dom.ensureCreated(marker);
        } else {
            this.deck.ensureCreated(marker);
        }
    }

    public syncAll(iterable: Iterable<Marker>): void {
        // Only non-search markers are part of deck layer's global sync
        const nonSearch: Marker[] = [];
        for (const marker of iterable) {
            if (marker.getSource() !== 'search') {
                nonSearch.push(marker);
            }
        }
        this.deck.syncAll(nonSearch);
    }

    public show(marker: Marker): void {
        if (marker.getSource() === 'search') {
            this.dom.show(marker);
        } else {
            this.deck.show(marker);
        }
    }

    public hide(marker: Marker): void {
        if (marker.getSource() === 'search') {
            this.dom.hide(marker);
        } else {
            this.deck.hide(marker);
        }
    }

    public remove(marker: Marker, onRemoved?: () => void): void {
        if (marker.getSource() === 'search') {
            this.dom.remove(marker, onRemoved);
        } else {
            this.deck.remove(marker, onRemoved);
        }
    }

    public applyState(marker: Marker): void {
        if (marker.getSource() === 'search') {
            this.dom.applyState(marker);
        } else {
            this.deck.applyState(marker);
        }
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
}
