import {describe, expect, it} from 'vitest';
import {markerSprite} from './markerSprites';

function svgOf(url: string): string {
    return decodeURIComponent(url.replace('data:image/svg+xml;charset=utf-8,', ''));
}

describe('markerSprite', () => {
    it('bakes halo, disk, ring and glyph into a single image', () => {
        const svg = svgOf(markerSprite('#112233', 'zap', false).url);

        expect(svg).toContain('fill="rgb(17,34,51)" fill-opacity="0.4"');
        expect(svg).toContain('stroke="#ffffff"');
        expect(svg.match(/<svg/g)).toHaveLength(2);
    });

    it('marks visited markers with their own ring so the sprite stays self-contained', () => {
        expect(svgOf(markerSprite('#112233', 'zap', true).url)).toContain('stroke="#39ff14"');
    });

    it('reuses one atlas entry per style', () => {
        expect(markerSprite('#112233', 'zap', false)).toBe(markerSprite('#112233', 'zap', false));
        expect(markerSprite('#112233', 'zap', false).id).not.toBe(
            markerSprite('#112233', 'house', false).id,
        );
    });
});
