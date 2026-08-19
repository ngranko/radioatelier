import type {Marker} from '$lib/services/map/marker';
import {
    type ClusterPoint,
    type ClusteredPoint,
    type MarkerPoint,
} from '$lib/services/map/renderer/clustered/markerClusterIndex';
import {
    MARKER_SPRITE_SIZE,
    markerSpriteFor,
} from '$lib/services/map/renderer/clustered/markerSprites';
import {handleClusteredPickingClick} from '$lib/services/map/renderer/clustered/pickingClick';
import {SPRITE_FADE_MS, type SpriteFade} from '$lib/services/map/renderer/clustered/spriteFades';
import type {Layer} from '@deck.gl/core';
import {IconLayer, ScatterplotLayer, TextLayer} from '@deck.gl/layers';

const WHITE: [number, number, number] = [255, 255, 255];
const CLUSTER_FILL: [number, number, number, number] = [39, 39, 42, 235];
const CLUSTER_LINE: [number, number, number, number] = [255, 255, 255, 230];
const REMOVED_ALPHA = 128;

interface LayerHandlers {
    onMarkerClick(marker: Marker): void;
    onClusterClick(cluster: ClusterPoint): void;
}

export function buildClusteredLayers(
    points: ClusteredPoint[],
    fades: SpriteFade[],
    handlers: LayerHandlers,
): Layer[] {
    const markers = points
        .filter((point): point is MarkerPoint => point.kind === 'marker')
        .sort(northToSouth);
    const clusters = points.filter((point): point is ClusterPoint => point.kind === 'cluster');

    return [
        markerLayer(markers, handlers),
        fadingMarkerLayer(fades),
        clusterDiskLayer(clusters, handlers),
        clusterCountLayer(clusters),
    ];
}

/** Sprites occlude by draw order, so a stable geographic order beats the incoming index order. */
function northToSouth(a: MarkerPoint, b: MarkerPoint): number {
    return b.position[1] - a.position[1];
}

function markerLayer(data: MarkerPoint[], handlers: LayerHandlers) {
    return new IconLayer<MarkerPoint>({
        id: 'clustered-marker',
        data,
        getPosition: point => point.position,
        getIcon: point => markerSpriteFor(point.marker),
        getColor: point => [...WHITE, markerAlpha(point.marker)],
        getSize: MARKER_SPRITE_SIZE,
        sizeUnits: 'pixels',
        billboard: true,
        pickable: true,
        onClick: (info, event) =>
            handleClusteredPickingClick(info, event, point => handlers.onMarkerClick(point.marker)),
        transitions: {getColor: SPRITE_FADE_MS},
    });
}

/** Drawn above the live sprites: the outgoing sprite eases to nothing, revealing the new one under it. */
function fadingMarkerLayer(data: SpriteFade[]) {
    return new IconLayer<SpriteFade>({
        id: 'clustered-marker-fade',
        data,
        getPosition: fade => fade.point.position,
        getIcon: fade => fade.sprite,
        getColor: fade => [...WHITE, fade.fresh ? markerAlpha(fade.point.marker) : 0],
        getSize: MARKER_SPRITE_SIZE,
        sizeUnits: 'pixels',
        billboard: true,
        pickable: false,
        transitions: {getColor: SPRITE_FADE_MS},
    });
}

function clusterDiskLayer(data: ClusterPoint[], handlers: LayerHandlers) {
    return new ScatterplotLayer<ClusterPoint>({
        id: 'marker-clusters',
        data,
        getPosition: point => point.position,
        getFillColor: CLUSTER_FILL,
        getLineColor: CLUSTER_LINE,
        getRadius: point => 16 + Math.min(10, Math.log2(point.markerCount) * 1.8),
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

function markerAlpha(marker: Marker): number {
    return marker.getState().isRemoved ? REMOVED_ALPHA : 255;
}
