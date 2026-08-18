import type {MapProvider} from '$lib/interfaces/map';
import type {Marker} from '$lib/services/map/marker';
import {markerLifecycle} from '$lib/services/map/markerLifecycle';
import type {DeckOverlayHost} from '$lib/services/map/providers/google/deckOverlayHost';
import {buildClusteredLayers} from '$lib/services/map/renderer/clustered/clusteredLayers';
import {
    type ClusterPoint,
    type MarkerPoint,
    MarkerClusterIndex,
} from '$lib/services/map/renderer/clustered/markerClusterIndex';
import type {MarkerRenderer} from '$lib/services/map/renderer/markerRenderer';

const RENDER_DEBOUNCE_MS = 16;

export class ClusteredMarkerRenderer implements MarkerRenderer {
    private markers = new Set<Marker>();
    private clusterIndex = new MarkerClusterIndex();
    private excludedMarker?: Marker;
    private indexDirty = true;
    private scheduled = false;
    private clusteringEnabled: boolean;
    private renderTimeout?: ReturnType<typeof setTimeout>;
    private renderFrame?: number;

    public constructor(
        private provider: MapProvider,
        private overlay: DeckOverlayHost,
        private onInteraction: () => void,
        clusteringEnabled = true,
    ) {
        this.clusteringEnabled = clusteringEnabled;
        this.overlay.attach();
    }

    public setClusteringEnabled(enabled: boolean): void {
        if (this.clusteringEnabled === enabled) {
            return;
        }
        this.clusteringEnabled = enabled;
        this.scheduleRender();
    }

    public ensureCreated(marker: Marker): void {
        this.markers.add(marker);
        this.indexDirty = true;
        this.scheduleRender();
    }

    public syncAll(iterable: Iterable<Marker>): void {
        const nextMarkers = new Set(iterable);
        if (!sameMembers(this.markers, nextMarkers)) {
            this.markers = nextMarkers;
            this.indexDirty = true;
        }
        this.scheduleRender();
    }

    public show(): void {}

    public hide(): void {}

    public remove(marker: Marker, onRemoved?: () => void): void {
        this.markers.delete(marker);
        if (this.excludedMarker === marker) {
            this.excludedMarker = undefined;
        }
        this.indexDirty = true;
        this.scheduleRender();
        onRemoved?.();
    }

    public applyState(_marker: Marker): void {
        this.scheduleRender();
    }

    public setExcludedMarker(marker: Marker | undefined): void {
        if (marker === this.excludedMarker) {
            return;
        }
        this.excludedMarker = marker;
        this.indexDirty = true;
        this.scheduleRender();
    }

    public destroy(): void {
        this.markers.clear();
        if (this.renderTimeout !== undefined) {
            clearTimeout(this.renderTimeout);
        }
        if (this.renderFrame !== undefined) {
            cancelAnimationFrame(this.renderFrame);
        }
        this.cancelScheduled();
        this.overlay.detach();
    }

    private scheduleRender(): void {
        if (this.scheduled) {
            return;
        }
        this.scheduled = true;
        markerLifecycle.begin();
        this.renderTimeout = setTimeout(() => {
            this.renderTimeout = undefined;
            this.renderFrame = requestAnimationFrame(() => {
                this.renderFrame = undefined;
                this.scheduled = false;
                try {
                    this.render();
                } finally {
                    markerLifecycle.end();
                }
            });
        }, RENDER_DEBOUNCE_MS);
    }

    private render(): void {
        const points = this.clusteringEnabled ? this.clusteredPoints() : this.individualPoints();
        this.overlay.setLayers(
            buildClusteredLayers(points, {
                onMarkerClick: marker => this.handleMarkerClick(marker),
                onClusterClick: cluster => this.handleClusterClick(cluster),
            }),
        );
    }

    private clusteredPoints() {
        if (this.indexDirty) {
            this.clusterIndex.load(this.clusteredMarkers());
            this.indexDirty = false;
        }
        return this.clusterIndex.getPoints(this.provider.getZoom());
    }

    private individualPoints(): MarkerPoint[] {
        const points: MarkerPoint[] = [];
        for (const marker of this.clusteredMarkers()) {
            const {lat, lng} = marker.getPosition();
            points.push({kind: 'marker', marker, position: [lng, lat]});
        }
        return points;
    }

    private *clusteredMarkers(): Iterable<Marker> {
        for (const marker of this.markers) {
            if (marker !== this.excludedMarker) {
                yield marker;
            }
        }
    }

    private handleMarkerClick(marker: Marker): void {
        this.onInteraction();
        marker.options.onClick?.();
    }

    private handleClusterClick(cluster: ClusterPoint): void {
        this.onInteraction();
        const [lng, lat] = cluster.position;
        const expansionZoom = this.clusterIndex.getExpansionZoom(
            cluster.clusterId,
            cluster.indexVersion,
        );
        if (expansionZoom === undefined) {
            return;
        }
        const zoom = Math.min(this.provider.getMaxZoom(), expansionZoom);
        this.provider.setCenter(lat, lng);
        this.provider.setZoom(zoom);
    }

    private cancelScheduled(): void {
        if (!this.scheduled) {
            return;
        }
        this.scheduled = false;
        markerLifecycle.end();
    }
}

function sameMembers(current: ReadonlySet<Marker>, next: ReadonlySet<Marker>): boolean {
    if (current.size !== next.size) {
        return false;
    }
    for (const marker of current) {
        if (!next.has(marker)) {
            return false;
        }
    }
    return true;
}
