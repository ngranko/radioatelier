import MarkerIcon from '$lib/components/map/markerIcon.svelte';
import type {MarkerIcon as MarkerIconComponent} from '$lib/interfaces/marker';
import {markerIconMap} from '$lib/services/map/markerStyling';
import {MARKER_ICON_KEYS} from '$lib/services/map/markerStyling.data';
import {render} from 'svelte/server';
import {describe, expect, it} from 'vitest';
import {MARKER_GLYPHS} from './markerIcons';

// Sprites draw from lucide-static and promoted DOM markers from @lucide/svelte, so this is what
// notices when the two packages, or the ways they apply a style, drift apart.
describe('marker glyph parity', () => {
    it.each(MARKER_ICON_KEYS)('draws %s the same as a sprite and as a DOM marker', key => {
        const {component, style} = markerIconMap[key];
        const {body} = render(MarkerIcon, {
            props: {icon: component as MarkerIconComponent, iconStyle: style},
        });
        const glyph = MARKER_GLYPHS[key];
        const strokeWidth = String(style.strokeWidth ?? 2);

        expect(shapes(glyph).length).toBeGreaterThan(0);
        expect(shapes(body)).toEqual(shapes(glyph));
        expect(rootAttribute(glyph, 'stroke-width')).toBe(strokeWidth);
        expect(rootAttribute(body, 'stroke-width')).toBe(strokeWidth);
        expect(rootAttribute(body, 'fill')).toBe(style.filled ? 'currentColor' : 'none');
    });
});

function shapes(svg: string): string[] {
    const elements = svg.matchAll(
        /<(path|circle|rect|line|polyline|polygon|ellipse)\b([^>]*?)\/?>/g,
    );
    return [...elements].map(([, tag, attributes]) => {
        const sorted = attributes
            .trim()
            .split(/\s+(?=[\w-]+=)/)
            .sort();
        return `${tag} ${sorted.join(' ')}`;
    });
}

function rootAttribute(svg: string, name: string): string | undefined {
    return svg.match(new RegExp(`<svg[^>]*?\\s${name}="([^"]*)"`))?.[1];
}
