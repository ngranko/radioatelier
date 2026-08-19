import {describe, expect, it} from 'vitest';
import {markerSprite} from './markerSprites';

function svgOf(url: string): string {
    return decodeURIComponent(url.replace('data:image/svg+xml;charset=utf-8,', ''));
}

describe('markerSprite', () => {
    it('bakes halo, disk, ring and glyph into a single image', () => {
        const svg = svgOf(markerSprite('#112233', 'zap', false).url);

        expect(svg).toContain('r="17" fill="rgb(17,34,51)" fill-opacity="0.4"');
        expect(svg).toContain('r="15" fill="#ffffff"');
        expect(svg).toContain('r="12" fill="rgb(17,34,51)"');
        expect(svg).toContain('feGaussianBlur');
        expect(svg.match(/<svg/g)).toHaveLength(2);
    });

    it('marks visited markers with their own ring so the sprite stays self-contained', () => {
        expect(svgOf(markerSprite('#112233', 'zap', true).url)).toContain('r="15" fill="#39ff14"');
    });

    it('leaves the halo and its shadow out of the crossfade variant', () => {
        const core = svgOf(markerSprite('#112233', 'zap', false, false).url);

        expect(core).not.toContain('feGaussianBlur');
        expect(core).not.toContain('r="17"');
        expect(core).toContain('r="12" fill="rgb(17,34,51)"');
    });

    it('reuses one atlas entry per style', () => {
        expect(markerSprite('#112233', 'zap', false)).toBe(markerSprite('#112233', 'zap', false));
        expect(markerSprite('#112233', 'zap', false).id).not.toBe(
            markerSprite('#112233', 'house', false).id,
        );
    });
});
