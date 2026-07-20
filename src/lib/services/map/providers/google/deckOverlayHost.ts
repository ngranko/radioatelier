import type {Layer} from '@deck.gl/core';
import {GoogleMapsOverlay} from '@deck.gl/google-maps';

const POSITIONING_CONTAINER_SELECTOR = '#deck-gl-google-maps-container';

export class DeckOverlayHost {
    private overlay = new GoogleMapsOverlay({
        layers: [],
        // Shared-context overlays cannot reliably be recreated on the same vector map.
        // These 2D markers do not need to participate in the map's depth buffer.
        interleaved: false,
    });

    public constructor(private map: google.maps.Map) {}

    public attach(): void {
        this.overlay.setProps({layerFilter: null});
        this.overlay.setMap(this.map);
    }

    public setLayers(layers: Layer[]): void {
        this.overlay.setProps({layers});
    }

    public detach(): void {
        this.overlay.setProps({layers: []});
        this.overlay.setMap(null);
    }

    public destroy(): void {
        this.overlay.finalize();
        for (const container of this.map
            .getDiv()
            .querySelectorAll(POSITIONING_CONTAINER_SELECTOR)) {
            container.remove();
        }
    }
}
