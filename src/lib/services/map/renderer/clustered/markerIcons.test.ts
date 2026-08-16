import {MARKER_ICON_KEYS} from '$lib/services/map/markerStyling.data';
import {describe, expect, it} from 'vitest';
import {MARKER_ICON_DEFINITIONS} from './markerIcons';

describe('MARKER_ICON_DEFINITIONS', () => {
    it('contains a reusable masked SVG for every category icon', () => {
        expect(Object.keys(MARKER_ICON_DEFINITIONS)).toEqual(MARKER_ICON_KEYS);
        for (const icon of Object.values(MARKER_ICON_DEFINITIONS)) {
            expect(icon.url).toMatch(/^data:image\/svg\+xml/);
            expect(icon.mask).toBe(true);
        }
    });
});
