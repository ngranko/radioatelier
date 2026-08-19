import type {Layer, PickingInfo} from '@deck.gl/core';
import {GoogleMapsOverlay} from '@deck.gl/google-maps';

const POSITIONING_CONTAINER_SELECTOR = '#deck-gl-google-maps-container';
const HOVER_CURSOR = 'pointer';

export class DeckOverlayHost {
    private overlay = new GoogleMapsOverlay({
        layers: [],
        // Shared-context overlays cannot reliably be recreated on the same vector map.
        // These 2D markers do not need to participate in the map's depth buffer.
        interleaved: false,
    });
    private hoverCursor: string | null = null;

    public constructor(private map: google.maps.Map) {}

    public attach(): void {
        this.overlay.setProps({
            layerFilter: null,
            onHover: (info: PickingInfo) => this.setHoverCursor(info.object ? HOVER_CURSOR : null),
        });
        this.overlay.setMap(this.map);
    }

    public setLayers(layers: Layer[]): void {
        this.overlay.setProps({layers});
    }

    public detach(): void {
        this.setHoverCursor(null);
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

    // The deck canvas is stacked over the map with pointer events disabled, so the
    // cursor deck sets on it never reaches the pointer — the map div has to carry it.
    private setHoverCursor(cursor: string | null): void {
        if (cursor === this.hoverCursor) {
            return;
        }
        this.hoverCursor = cursor;
        this.map.setOptions({draggableCursor: cursor});
    }
}
