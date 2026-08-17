import type {Marker} from '$lib/services/map/marker';
import Supercluster from 'supercluster';

interface MarkerProperties {
    marker: Marker;
}

interface ClusterProperties {
    markerCount: number;
}

export interface MarkerPoint {
    kind: 'marker';
    marker: Marker;
    position: [number, number];
}

export interface ClusterPoint {
    kind: 'cluster';
    clusterId: number;
    indexVersion: number;
    markerCount: number;
    label: string;
    position: [number, number];
}

export type ClusteredPoint = MarkerPoint | ClusterPoint;

const WORLD_BOUNDS: [number, number, number, number] = [-180, -85.0511, 180, 85.0511];

export class MarkerClusterIndex {
    private index = createIndex();
    private version = 0;

    public load(markers: Iterable<Marker>): void {
        const features: Supercluster.PointFeature<MarkerProperties>[] = [];

        for (const marker of markers) {
            features.push({
                type: 'Feature',
                properties: {marker},
                geometry: {
                    type: 'Point',
                    coordinates: toCoordinates(marker),
                },
            });
        }

        this.index = createIndex().load(features);
        this.version++;
    }

    public getPoints(zoom: number): ClusteredPoint[] {
        return this.index
            .getClusters(WORLD_BOUNDS, Math.max(0, Math.floor(zoom)))
            .flatMap(feature => this.toPoint(feature));
    }

    public getExpansionZoom(clusterId: number, indexVersion: number): number | undefined {
        if (indexVersion !== this.version) {
            return undefined;
        }
        try {
            return this.index.getClusterExpansionZoom(clusterId);
        } catch {
            return undefined;
        }
    }

    private toPoint(
        feature:
            | Supercluster.ClusterFeature<ClusterProperties>
            | Supercluster.PointFeature<MarkerProperties>,
    ): ClusteredPoint[] {
        const position = feature.geometry.coordinates as [number, number];
        if ('cluster' in feature.properties && feature.properties.cluster) {
            return [
                {
                    kind: 'cluster',
                    clusterId: feature.properties.cluster_id,
                    indexVersion: this.version,
                    markerCount: feature.properties.point_count,
                    label: String(feature.properties.point_count_abbreviated),
                    position,
                },
            ];
        }

        if (!('marker' in feature.properties)) {
            return [];
        }
        return [{kind: 'marker', marker: feature.properties.marker, position}];
    }
}

function createIndex() {
    return new Supercluster<MarkerProperties, ClusterProperties>({
        radius: 56,
        maxZoom: 17,
        minPoints: 3,
        map: () => ({markerCount: 1}),
        reduce: (cluster, point) => {
            cluster.markerCount += point.markerCount;
        },
    });
}

function toCoordinates(marker: Marker): [number, number] {
    const {lat, lng} = marker.getPosition();
    return [lng, lat];
}
