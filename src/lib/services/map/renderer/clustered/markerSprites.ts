import {cssColorToRgb} from '$lib/services/colorConverter';
import type {Marker} from '$lib/services/map/marker';
import type {MarkerIconKey} from '$lib/services/map/markerStyling.data';
import {GLYPH_VIEWBOX_SIZE, MARKER_GLYPHS} from '$lib/services/map/renderer/clustered/markerIcons';

// Every measure below mirrors the DOM marker in renderer/dom/factory.ts: a 24px disk (w-6 h-6)
// wearing box-shadow rings, so a promoted DOM marker is indistinguishable from its sprite.
export const MARKER_SPRITE_SIZE = 40;

const DISK_RADIUS = 12;
const RING_RADIUS = 15;
const HALO_RADIUS = 17;
const VISITED_EDGE_RADIUS = 13;
const VISITED_EDGE_OPACITY = 0.3;
const GLYPH_SIZE = 14;
const HALO_OPACITY = 0.4;
const VISITED_RING = '#39ff14';
const PLAIN_RING = '#ffffff';
const SHADOW_OFFSET = 2;
const SHADOW_DEVIATION = 2;
const SHADOW_OPACITY = 0.2;
// Sprites are rasterised at twice their on-screen size so the atlas stays sharp on retina displays.
const RASTER_SCALE = 2;

export interface MarkerSprite {
    id: string;
    url: string;
    width: number;
    height: number;
    mask: false;
}

const sprites = new Map<string, MarkerSprite>();

export function markerSpriteFor(marker: Marker, withHalo = true): MarkerSprite {
    const iconKey = marker.options.iconKey ?? 'landmark';
    return markerSprite(marker.options.color, iconKey, marker.getState().isVisited, withHalo);
}

/**
 * Halo, disk, ring and glyph baked into one image. Drawing a marker as a single sprite is what
 * keeps overlapping markers from bleeding: separate layers stack per layer, so every glyph ended
 * up painted over every disk, while one sprite occludes its neighbours whole.
 *
 * The halo-less variant exists for crossfades: stacking it over a full sprite swaps the disk
 * without compositing two translucent halos into a darker ring.
 */
export function markerSprite(
    color: string,
    iconKey: MarkerIconKey,
    isVisited: boolean,
    withHalo = true,
): MarkerSprite {
    const id = `${iconKey}:${color}:${isVisited ? 'visited' : 'plain'}:${withHalo ? 'halo' : 'core'}`;
    const cached = sprites.get(id);
    if (cached) {
        return cached;
    }

    const size = MARKER_SPRITE_SIZE * RASTER_SCALE;
    const sprite: MarkerSprite = {
        id,
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(spriteSvg(color, iconKey, isVisited, withHalo))}`,
        width: size,
        height: size,
        mask: false,
    };
    sprites.set(id, sprite);
    return sprite;
}

function spriteSvg(
    color: string,
    iconKey: MarkerIconKey,
    isVisited: boolean,
    withHalo: boolean,
): string {
    const center = MARKER_SPRITE_SIZE / 2;
    const fill = sRgbCss(color);
    const glyphOffset = center - GLYPH_SIZE / 2;
    const glyphScale = GLYPH_SIZE / GLYPH_VIEWBOX_SIZE;

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_SPRITE_SIZE * RASTER_SCALE}" height="${MARKER_SPRITE_SIZE * RASTER_SCALE}" viewBox="0 0 ${MARKER_SPRITE_SIZE} ${MARKER_SPRITE_SIZE}">`,
        withHalo ? shadowSvg(center) : '',
        withHalo ? circle(center, HALO_RADIUS, fill, HALO_OPACITY) : '',
        circle(center, RING_RADIUS, isVisited ? VISITED_RING : PLAIN_RING),
        isVisited ? circle(center, VISITED_EDGE_RADIUS, '#000000', VISITED_EDGE_OPACITY) : '',
        circle(center, DISK_RADIUS, fill),
        `<g transform="translate(${glyphOffset} ${glyphOffset}) scale(${glyphScale})">${MARKER_GLYPHS[iconKey]}</g>`,
        '</svg>',
    ].join('');
}

function circle(center: number, radius: number, fill: string, opacity = 1): string {
    return `<circle cx="${center}" cy="${center}" r="${radius}" fill="${fill}" fill-opacity="${opacity}"/>`;
}

// The DOM marker's `0 2px 4px rgba(0,0,0,0.2)` shadow: a CSS blur radius is twice the deviation.
function shadowSvg(center: number): string {
    return [
        `<filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">`,
        `<feGaussianBlur stdDeviation="${SHADOW_DEVIATION}"/></filter>`,
        `<circle cx="${center}" cy="${center + SHADOW_OFFSET}" r="${DISK_RADIUS}" fill="#000000"`,
        ` fill-opacity="${SHADOW_OPACITY}" filter="url(#shadow)"/>`,
    ].join('');
}

// Marker colours are authored in oklch, which not every SVG rasteriser accepts; resolve to sRGB first.
function sRgbCss(color: string): string {
    const {r, g, b} = cssColorToRgb(color);
    return `rgb(${r},${g},${b})`;
}
