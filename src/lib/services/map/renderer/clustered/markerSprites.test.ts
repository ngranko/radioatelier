import {describe, expect, it} from 'vitest';
import {markerSprite, type SpriteStyle} from './markerSprites';

function style(overrides: Partial<SpriteStyle> = {}): SpriteStyle {
    return {
        color: '#112233',
        iconKey: 'zap',
        isVisited: false,
        isRemoved: false,
        withHalo: true,
        ...overrides,
    };
}

function svgOf(url: string): string {
    return decodeURIComponent(url.replace('data:image/svg+xml;charset=utf-8,', ''));
}

describe('markerSprite', () => {
    it('bakes halo, disk, ring and glyph into a single image', () => {
        const svg = svgOf(markerSprite(style()).url);

        expect(svg).toContain('r="17" fill="rgb(17,34,51)" fill-opacity="0.4"');
        expect(svg).toContain('r="15" fill="#ffffff"');
        expect(svg).toContain('r="12" fill="rgb(17,34,51)"');
        expect(svg).toContain('feGaussianBlur');
        expect(svg.match(/<svg/g)).toHaveLength(2);
    });

    it('marks visited markers with their own ring so the sprite stays self-contained', () => {
        expect(svgOf(markerSprite(style({isVisited: true})).url)).toContain(
            'r="15" fill="#39ff14"',
        );
    });

    it('carries the removed state itself, so the layer needs no per-marker colour', () => {
        expect(svgOf(markerSprite(style({isRemoved: true})).url)).toContain('<g opacity="0.5">');
        expect(svgOf(markerSprite(style()).url)).toContain('<g opacity="1">');
    });

    it('leaves the halo and its shadow out of the crossfade variant', () => {
        const core = svgOf(markerSprite(style({withHalo: false})).url);

        expect(core).not.toContain('feGaussianBlur');
        expect(core).not.toContain('r="17"');
        expect(core).toContain('r="12" fill="rgb(17,34,51)"');
    });

    it('reuses one atlas entry per style', () => {
        expect(markerSprite(style())).toBe(markerSprite(style()));
        expect(markerSprite(style()).id).not.toBe(markerSprite(style({isRemoved: true})).id);
        expect(markerSprite(style()).id).not.toBe(markerSprite(style({iconKey: 'house'})).id);
    });
});
