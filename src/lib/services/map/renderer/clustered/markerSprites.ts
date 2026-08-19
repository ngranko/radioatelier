import {cssColorToRgb} from '$lib/services/colorConverter';
import type {MarkerIconKey} from '$lib/services/map/markerStyling.data';
import {GLYPH_VIEWBOX_SIZE, MARKER_GLYPHS} from '$lib/services/map/renderer/clustered/markerIcons';

export const MARKER_SPRITE_SIZE = 30;

const DISK_RADIUS = 12;
const RING_WIDTH = 3;
const GLYPH_SIZE = 14;
const HALO_OPACITY = 0.4;
const VISITED_RING = '#39ff14';
const PLAIN_RING = '#ffffff';
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

/**
 * Halo, disk, ring and glyph baked into one image. Drawing a marker as a single sprite is what
 * keeps overlapping markers from bleeding: separate layers stack per layer, so every glyph ended
 * up painted over every disk, while one sprite occludes its neighbours whole.
 */
export function markerSprite(
    color: string,
    iconKey: MarkerIconKey,
    isVisited: boolean,
): MarkerSprite {
    const id = `${iconKey}:${color}:${isVisited ? 'visited' : 'plain'}`;
    const cached = sprites.get(id);
    if (cached) {
        return cached;
    }

    const size = MARKER_SPRITE_SIZE * RASTER_SCALE;
    const sprite: MarkerSprite = {
        id,
        url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(spriteSvg(color, iconKey, isVisited))}`,
        width: size,
        height: size,
        mask: false,
    };
    sprites.set(id, sprite);
    return sprite;
}

function spriteSvg(color: string, iconKey: MarkerIconKey, isVisited: boolean): string {
    const center = MARKER_SPRITE_SIZE / 2;
    const fill = sRgbCss(color);
    const glyphOffset = center - GLYPH_SIZE / 2;
    const glyphScale = GLYPH_SIZE / GLYPH_VIEWBOX_SIZE;

    return [
        `<svg xmlns="http://www.w3.org/2000/svg" width="${MARKER_SPRITE_SIZE * RASTER_SCALE}" height="${MARKER_SPRITE_SIZE * RASTER_SCALE}" viewBox="0 0 ${MARKER_SPRITE_SIZE} ${MARKER_SPRITE_SIZE}">`,
        `<circle cx="${center}" cy="${center}" r="${center}" fill="${fill}" fill-opacity="${HALO_OPACITY}"/>`,
        `<circle cx="${center}" cy="${center}" r="${DISK_RADIUS}" fill="${fill}"/>`,
        `<circle cx="${center}" cy="${center}" r="${DISK_RADIUS - RING_WIDTH / 2}" fill="none" stroke="${isVisited ? VISITED_RING : PLAIN_RING}" stroke-width="${RING_WIDTH}"/>`,
        `<g transform="translate(${glyphOffset} ${glyphOffset}) scale(${glyphScale})">${MARKER_GLYPHS[iconKey]}</g>`,
        '</svg>',
    ].join('');
}

// Marker colours are authored in oklch, which not every SVG rasteriser accepts; resolve to sRGB first.
function sRgbCss(color: string): string {
    const {r, g, b} = cssColorToRgb(color);
    return `rgb(${r},${g},${b})`;
}
