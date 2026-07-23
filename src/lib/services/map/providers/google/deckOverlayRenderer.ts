import {cssColorToRgb} from '$lib/services/colorConverter';
import type {Marker} from '$lib/services/map/marker';
import type {DeckOverlayHost} from '$lib/services/map/providers/google/deckOverlayHost';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';
import {ScatterplotLayer} from '@deck.gl/layers';

const DOT_RADIUS_PX = 6;
const OUTLINE_WIDTH_PX = 2;
const HALO_RADIUS_PX = 9;
const HALO_ALPHA = 0x60 / 255;

interface DeckPointInfo {
    position: [number, number];
    fillColor: [number, number, number, number];
    outlineColor: [number, number, number];
    haloColor: [number, number, number, number];
}

export class DeckOverlayRenderer implements MarkerRenderer {
    private allMarkers = new Set<Marker>();
    private scheduled = false;
    private renderTimeout?: ReturnType<typeof setTimeout>;
    private renderFrame?: number;

    public constructor(private overlay: DeckOverlayHost) {
        this.overlay.attach();
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
        onRemoved?.();
    }

    public applyState(_marker: Marker): void {
        this.scheduleRender();
    }

    public destroy(): void {
        this.allMarkers.clear();
        if (this.renderTimeout !== undefined) {
            clearTimeout(this.renderTimeout);
        }
        if (this.renderFrame !== undefined) {
            cancelAnimationFrame(this.renderFrame);
        }
        this.scheduled = false;
        this.overlay.detach();
    }

    private scheduleRender() {
        if (this.scheduled) {
            return;
        }
        this.scheduled = true;
        this.renderTimeout = setTimeout(() => {
            this.renderTimeout = undefined;
            this.renderFrame = requestAnimationFrame(() => {
                this.renderFrame = undefined;
                this.scheduled = false;
                this.render();
            });
        }, 16); // ~60fps
    }

    private render() {
        const data: DeckPointInfo[] = Array.from(this.allMarkers).map(marker => {
            const pos = marker.getPosition();
            const {isVisited, isRemoved} = marker.getState();
            const {r, g, b} = cssColorToRgb(marker.options.color);
            const outline = isVisited ? cssColorToRgb('#39ff14') : cssColorToRgb('#ffffff');
            const opacityMult = isRemoved ? 0.5 : 1;
            return {
                position: [pos.lng, pos.lat],
                fillColor: [r, g, b, Math.round(255 * opacityMult)] as [
                    number,
                    number,
                    number,
                    number,
                ],
                outlineColor: [outline.r, outline.g, outline.b] as [number, number, number],
                haloColor: [r, g, b, Math.round(255 * HALO_ALPHA * opacityMult)] as [
                    number,
                    number,
                    number,
                    number,
                ],
            };
        });

        this.overlay.setLayers([this.createHaloLayer(data), this.createMarkerLayer(data)]);
    }

    private createHaloLayer(data: DeckPointInfo[]): ScatterplotLayer {
        return new ScatterplotLayer({
            id: 'markers-scatterplot-halo',
            data,
            getPosition: (d: DeckPointInfo) => d.position,
            getFillColor: (d: DeckPointInfo) => d.haloColor,
            radiusUnits: 'pixels',
            getRadius: HALO_RADIUS_PX,
            stroked: false,
            filled: true,
            pickable: false,
        });
    }

    private createMarkerLayer(data: DeckPointInfo[]): ScatterplotLayer {
        return new ScatterplotLayer({
            id: 'markers-scatterplot',
            data,
            getPosition: (d: DeckPointInfo) => d.position,
            getFillColor: (d: DeckPointInfo) => d.fillColor,
            getLineColor: (d: DeckPointInfo) => [...d.outlineColor, d.fillColor[3]],
            radiusUnits: 'pixels',
            getRadius: DOT_RADIUS_PX,
            lineWidthUnits: 'pixels',
            getLineWidth: OUTLINE_WIDTH_PX,
            stroked: true,
            filled: true,
            pickable: false,
        });
    }
}
