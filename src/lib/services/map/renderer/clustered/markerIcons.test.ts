import {MARKER_ICON_KEYS} from '$lib/services/map/markerStyling.data';
import {describe, expect, it} from 'vitest';
import {MARKER_GLYPHS} from './markerIcons';

describe('MARKER_GLYPHS', () => {
    it('contains white SVG markup for every category icon', () => {
        expect(Object.keys(MARKER_GLYPHS)).toEqual(MARKER_ICON_KEYS);
        for (const glyph of Object.values(MARKER_GLYPHS)) {
            expect(glyph).toMatch(/^<svg/);
            expect(glyph).toContain('stroke="white"');
        }
    });
});
