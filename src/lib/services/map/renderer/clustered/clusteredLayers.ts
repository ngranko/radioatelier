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
import {latestExitTime, type SpriteExit} from '$lib/services/map/renderer/clustered/spriteExits';
import {SPRITE_FADE_MS, type SpriteFade} from '$lib/services/map/renderer/clustered/spriteFades';
import {
    SPRITE_POP_OUT_MS,
    SpritePopExtension,
    type SpritePopProps,
} from '$lib/services/map/renderer/clustered/spritePopExtension';
import {getLatestSpawnTime, stampSpawn} from '$lib/services/map/renderer/clustered/spriteSpawns';
import type {Layer} from '@deck.gl/core';
import {IconLayer, ScatterplotLayer, TextLayer} from '@deck.gl/layers';

const WHITE: [number, number, number] = [255, 255, 255];
const CLUSTER_FILL: [number, number, number, number] = [39, 39, 42, 235];
const CLUSTER_LINE: [number, number, number, number] = [255, 255, 255, 230];
const OPAQUE = 255;
const SPRITE_POP_IN = new SpritePopExtension();
const SPRITE_POP_OUT = new SpritePopExtension({reverse: true, durationMs: SPRITE_POP_OUT_MS});

interface LayerHandlers {
    onMarkerClick(marker: Marker): void;
    onClusterClick(cluster: ClusterPoint): void;
}

export interface SpriteAnimations {
    fades: SpriteFade[];
    exits: SpriteExit[];
}

export function buildClusteredLayers(
    points: ClusteredPoint[],
    animations: SpriteAnimations,
    handlers: LayerHandlers,
): Layer[] {
    const markers = points
        .filter((point): point is MarkerPoint => point.kind === 'marker')
        .sort(northToSouth);
    const clusters = points.filter((point): point is ClusterPoint => point.kind === 'cluster');
    const latestSpawn = getLatestSpawnTime(markers);

    return [
        markerLayer(markers, latestSpawn, handlers),
        exitingMarkerLayer(animations.exits),
        fadingMarkerLayer(animations.fades),
        clusterDiskLayer(clusters, handlers),
        clusterCountLayer(clusters),
    ];
}

/** Sprites occlude by draw order, so a stable geographic order beats the incoming index order. */
function northToSouth(a: MarkerPoint, b: MarkerPoint): number {
    return b.position[1] - a.position[1];
}

function markerLayer(data: MarkerPoint[], latestSpawn: number, handlers: LayerHandlers) {
    return new IconLayer<MarkerPoint, SpritePopProps<MarkerPoint>>({
        id: 'clustered-marker',
        data,
        getPosition: point => point.position,
        getIcon: point => markerSpriteFor(point.marker),
        getSize: MARKER_SPRITE_SIZE,
        getPopTime: point => stampSpawn(point.marker),
        latestPop: latestSpawn,
        extensions: [SPRITE_POP_IN],
        sizeUnits: 'pixels',
        billboard: true,
        pickable: true,
        onClick: (info, event) =>
            handleClusteredPickingClick(info, event, point => handlers.onMarkerClick(point.marker)),
    });
}

/** A removed marker shrinks away here, drawn from the copy its tracker kept. */
function exitingMarkerLayer(data: SpriteExit[]) {
    return new IconLayer<SpriteExit, SpritePopProps<SpriteExit>>({
        id: 'clustered-marker-exit',
        data,
        getPosition: exit => exit.position,
        getIcon: exit => exit.sprite,
        getSize: MARKER_SPRITE_SIZE,
        sizeUnits: 'pixels',
        billboard: true,
        pickable: false,
        getPopTime: exit => exit.leftAt,
        latestPop: latestExitTime(data),
        extensions: [SPRITE_POP_OUT],
    });
}

/** Drawn above the live sprites: the outgoing sprite eases to nothing, revealing the new one under it. */
function fadingMarkerLayer(data: SpriteFade[]) {
    return new IconLayer<SpriteFade>({
        id: 'clustered-marker-fade',
        data,
        getPosition: fade => fade.point.position,
        getIcon: fade => fade.sprite,
        getColor: fade => [...WHITE, fade.fresh ? OPAQUE : 0],
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
