import {cssColorToRgb} from '$lib/services/colorConverter';
import type {Marker} from '$lib/services/map/marker';
import type {MarkerIconKey} from '$lib/services/map/markerStyling.data';
import {
    type ClusterPoint,
    type ClusteredPoint,
    type MarkerPoint,
} from '$lib/services/map/renderer/clustered/markerClusterIndex';
import {MARKER_ICON_DEFINITIONS} from '$lib/services/map/renderer/clustered/markerIcons';
import {handleClusteredPickingClick} from '$lib/services/map/renderer/clustered/pickingClick';
import type {Layer} from '@deck.gl/core';
import {IconLayer, ScatterplotLayer, TextLayer} from '@deck.gl/layers';

const WHITE: [number, number, number] = [255, 255, 255];
const VISITED: [number, number, number] = [57, 255, 20];
const CLUSTER_FILL: [number, number, number, number] = [39, 39, 42, 235];
const CLUSTER_LINE: [number, number, number, number] = [255, 255, 255, 230];

interface LayerHandlers {
    onMarkerClick(marker: Marker): void;
    onClusterClick(cluster: ClusterPoint): void;
}

export function buildClusteredLayers(points: ClusteredPoint[], handlers: LayerHandlers): Layer[] {
    const markers = points.filter((point): point is MarkerPoint => point.kind === 'marker');
    const clusters = points.filter((point): point is ClusterPoint => point.kind === 'cluster');

    return [
        markerHaloLayer(markers),
        markerDiskLayer(markers, handlers),
        markerIconLayer(markers),
        clusterDiskLayer(clusters, handlers),
        clusterCountLayer(clusters),
    ];
}

function markerHaloLayer(data: MarkerPoint[]) {
    return new ScatterplotLayer<MarkerPoint>({
        id: 'clustered-marker-halo',
        data,
        getPosition: point => point.position,
        getFillColor: point => colorWithAlpha(point.marker, 96),
        getRadius: 15,
        radiusUnits: 'pixels',
        stroked: false,
        pickable: false,
        transitions: {getFillColor: 160},
    });
}

function markerDiskLayer(data: MarkerPoint[], handlers: LayerHandlers) {
    return new ScatterplotLayer<MarkerPoint>({
        id: 'clustered-marker-disk',
        data,
        getPosition: point => point.position,
        getFillColor: point => markerColor(point.marker),
        getLineColor: point => outlineColor(point.marker),
        getRadius: 12,
        radiusUnits: 'pixels',
        getLineWidth: 3,
        lineWidthUnits: 'pixels',
        filled: true,
        stroked: true,
        pickable: true,
        onClick: (info, event) =>
            handleClusteredPickingClick(info, event, point => handlers.onMarkerClick(point.marker)),
        transitions: {getFillColor: 160, getLineColor: 160},
    });
}

function markerIconLayer(data: MarkerPoint[]) {
    return new IconLayer<MarkerPoint>({
        id: 'clustered-marker-icon',
        data,
        getPosition: point => point.position,
        getIcon: point => iconFor(point.marker),
        getColor: point => [255, 255, 255, point.marker.getState().isRemoved ? 128 : 255],
        getSize: 14,
        sizeUnits: 'pixels',
        billboard: true,
        pickable: false,
        transitions: {getColor: 160},
    });
}

function clusterDiskLayer(data: ClusterPoint[], handlers: LayerHandlers) {
    return new ScatterplotLayer<ClusterPoint>({
        id: 'marker-clusters',
        data,
        getPosition: point => point.position,
        getFillColor: CLUSTER_FILL,
        getLineColor: CLUSTER_LINE,
        getRadius: point => 14 + Math.min(10, Math.log2(point.markerCount) * 1.8),
        radiusUnits: 'pixels',
        getLineWidth: 2,
        lineWidthUnits: 'pixels',
        filled: true,
        stroked: true,
        pickable: true,
        onClick: (info, event) =>
            handleClusteredPickingClick(info, event, cluster => handlers.onClusterClick(cluster)),
    });
}

function clusterCountLayer(data: ClusterPoint[]) {
    return new TextLayer<ClusterPoint>({
        id: 'marker-cluster-counts',
        data,
        getPosition: point => point.position,
        getText: point => point.label,
        getColor: WHITE,
        getSize: 12,
        sizeUnits: 'pixels',
        getTextAnchor: 'middle',
        getAlignmentBaseline: 'center',
        fontWeight: 700,
        pickable: false,
    });
}

function markerColor(marker: Marker): [number, number, number, number] {
    return colorWithAlpha(marker, 255);
}

function colorWithAlpha(marker: Marker, alpha: number): [number, number, number, number] {
    const {r, g, b} = cssColorToRgb(marker.options.color);
    return [r, g, b, marker.getState().isRemoved ? Math.round(alpha / 2) : alpha];
}

function outlineColor(marker: Marker): [number, number, number, number] {
    const color = marker.getState().isVisited ? VISITED : WHITE;
    return [...color, marker.getState().isRemoved ? 128 : 255];
}

function iconFor(marker: Marker) {
    const key: MarkerIconKey = marker.options.iconKey ?? 'landmark';
    return MARKER_ICON_DEFINITIONS[key];
}
