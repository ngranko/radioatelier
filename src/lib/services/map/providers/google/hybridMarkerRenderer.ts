import type {MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {DeckOverlayRenderer} from '$lib/services/map/providers/google/deckOverlayRenderer';
import type {GoogleMapsProvider} from '$lib/services/map/providers/google/provider';
import {DomMarkerRenderer} from '$lib/services/map/renderer/domMarkerRenderer';
import type {MarkerRenderer, RendererMode} from '$lib/services/map/renderer/markerRenderer';

export class HybridMarkerRenderer implements MarkerRenderer {
    private dom: DomMarkerRenderer;
    private deck?: DeckOverlayRenderer;
    private useDeck = false;

    public constructor(
        private provider: MapProvider,
        mode: RendererMode = 'dom',
    ) {
        this.dom = new DomMarkerRenderer(provider);
        this.setMode(mode);
    }

    public setMode(mode: RendererMode): void {
        const useDeck = mode === 'deck';
        if (useDeck === this.useDeck) {
            return;
        }

        this.useDeck = useDeck;
        if (useDeck) {
            this.deck = new DeckOverlayRenderer(this.requireOverlay());
            return;
        }

        this.deck?.destroy();
        this.deck = undefined;
    }

    public ensureCreated(marker: Marker): void {
        this.rendererFor(marker).ensureCreated(marker);
    }

    public syncAll(iterable: Iterable<Marker>): void {
        if (!this.deck) {
            return;
        }

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
        this.deck?.remove(marker);
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
            this.deck?.destroy();
        } catch (e) {
            console.error('error destroying DeckOverlayRenderer:', e);
        }
    }

    private rendererFor(marker: Marker): MarkerRenderer {
        if (this.deck && !marker.isServiceMarker()) {
            return this.deck;
        }
        return this.dom;
    }

    private requireOverlay() {
        if (
            !('getDeckOverlay' in this.provider) ||
            typeof this.provider.getDeckOverlay !== 'function'
        ) {
            throw new Error('HybridMarkerRenderer requires a GoogleMapsProvider');
        }
        return (this.provider as GoogleMapsProvider).getDeckOverlay();
    }
}
