import {hexToRgb} from '$lib/services/colorConverter';
import {GoogleMapsOverlay} from '@deck.gl/google-maps';
import {ScatterplotLayer} from '@deck.gl/layers';
import type {Marker} from '$lib/services/map/marker';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';

interface DeckPointInfo {
    position: [number, number];
    color: [number, number, number];
}

export class DeckOverlayRenderer implements MarkerRenderer {
    private overlay: GoogleMapsOverlay;
    private allMarkers = new Set<Marker>();
    private scheduled = false;

    public constructor(private map: google.maps.Map) {
        this.overlay = new GoogleMapsOverlay({layers: []});
        this.overlay.setMap(this.map);
    }

    public ensureCreated(marker: Marker): void {
        this.allMarkers.add(marker);
        this.scheduleRender();
    }

    public syncAll(iterable: Iterable<Marker>): void {
        this.allMarkers.clear();
        for (const marker of iterable) {
            this.allMarkers.add(marker);
        }
        this.scheduleRender();
    }

    public show(_marker: Marker): void {
        // No-op; all markers rendered in one deck.gl layer
    }

    public hide(_marker: Marker): void {
        // No-op; all markers rendered in one deck.gl layer
    }

    public remove(marker: Marker, onRemoved?: () => void): void {
        this.allMarkers.delete(marker);
        this.scheduleRender();
        if (onRemoved) {
            onRemoved();
        }
    }

    public applyState(_marker: Marker): void {
        // No-op; all markers rendered in one deck.gl layer
    }

    public destroy(): void {
        this.allMarkers.clear();
        this.overlay.setProps({layers: []});
        this.overlay.setMap(null as unknown as google.maps.Map);
    }

    private scheduleRender() {
        if (this.scheduled) {
            return;
        }
        this.scheduled = true;
        setTimeout(() => {
            requestAnimationFrame(() => {
                this.scheduled = false;
                this.render();
            });
        }, 16); // ~60fps
    }

    private render() {
        const data: DeckPointInfo[] = Array.from(this.allMarkers).map(marker => {
            const pos = marker.getPosition();
            const {r, g, b} = hexToRgb(marker.getColor());
            return {
                position: [pos.lng, pos.lat],
                color: [r, g, b] as [number, number, number],
            };
        });

        const layer = new ScatterplotLayer({
            id: 'markers-scatterplot',
            data,
            getPosition: (d: DeckPointInfo) => d.position,
            getFillColor: (d: DeckPointInfo) => d.color,
            // TODO: no isVisited/isRemoved support for deck for now
            radiusUnits: 'pixels',
            getRadius: 6,
            pickable: true,
        });

        this.overlay.setProps({layers: [layer]});
    }
}
