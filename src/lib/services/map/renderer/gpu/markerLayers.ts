import type {Marker} from '$lib/services/map/marker';
import type {MarkerPoint} from '$lib/services/map/renderer/gpu/markerPoints';
import {MARKER_SPRITE_SIZE, markerSpriteFor} from '$lib/services/map/renderer/gpu/markerSprites';
import {handleSpritePickingClick} from '$lib/services/map/renderer/gpu/pickingClick';
import {findLatestExitTime, type SpriteExit} from '$lib/services/map/renderer/gpu/spriteExits';
import {SPRITE_FADE_MS, type SpriteFade} from '$lib/services/map/renderer/gpu/spriteFades';
import {
    SPRITE_POP_OUT_MS,
    SpritePopExtension,
    type SpritePopProps,
} from '$lib/services/map/renderer/gpu/spritePopExtension';
import {findLatestPop, readPopTime} from '$lib/services/map/renderer/gpu/spritePopTimes';
import type {Layer} from '@deck.gl/core';
import {IconLayer} from '@deck.gl/layers';

const WHITE: [number, number, number] = [255, 255, 255];
const OPAQUE = 255;
const SPRITE_POP_IN = new SpritePopExtension();
const SPRITE_POP_OUT = new SpritePopExtension({reverse: true, durationMs: SPRITE_POP_OUT_MS});

interface LayerHandlers {
    onMarkerClick(marker: Marker): void;
}

export interface SpriteAnimations {
    fades: SpriteFade[];
    exits: SpriteExit[];
}

export function buildMarkerLayers(
    points: MarkerPoint[],
    animations: SpriteAnimations,
    handlers: LayerHandlers,
): Layer[] {
    const markers = [...points].sort(compareNorthToSouth);
    const latestPop = findLatestPop(markers);

    return [
        buildMarkerLayer(markers, latestPop, handlers),
        buildExitingMarkerLayer(animations.exits),
        buildFadingMarkerLayer(animations.fades),
    ];
}

/** Sprites occlude by draw order, so a stable geographic order beats the incoming index order. */
function compareNorthToSouth(a: MarkerPoint, b: MarkerPoint): number {
    return b.position[1] - a.position[1];
}

function buildMarkerLayer(data: MarkerPoint[], latestPop: number, handlers: LayerHandlers) {
    return new IconLayer<MarkerPoint, SpritePopProps<MarkerPoint>>({
        id: 'gpu-marker',
        data,
        getPosition: point => point.position,
        getIcon: point => markerSpriteFor(point.marker),
        getSize: MARKER_SPRITE_SIZE,
        getPopTime: point => readPopTime(point.marker),
        latestPop,
        extensions: [SPRITE_POP_IN],
        sizeUnits: 'pixels',
        billboard: true,
        pickable: true,
        onClick: (info, event) =>
            handleSpritePickingClick(info, event, point => handlers.onMarkerClick(point.marker)),
    });
}

/** A removed marker shrinks away here, drawn from the copy its tracker kept. */
function buildExitingMarkerLayer(data: SpriteExit[]) {
    return new IconLayer<SpriteExit, SpritePopProps<SpriteExit>>({
        id: 'gpu-marker-exit',
        data,
        getPosition: exit => exit.position,
        getIcon: exit => exit.sprite,
        getSize: MARKER_SPRITE_SIZE,
        sizeUnits: 'pixels',
        billboard: true,
        pickable: false,
        getPopTime: exit => exit.leftAt,
        latestPop: findLatestExitTime(data),
        extensions: [SPRITE_POP_OUT],
    });
}

/** Drawn above the live sprites: the outgoing sprite eases to nothing, revealing the new one under it. */
function buildFadingMarkerLayer(data: SpriteFade[]) {
    return new IconLayer<SpriteFade>({
        id: 'gpu-marker-fade',
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
