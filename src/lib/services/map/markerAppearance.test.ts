import {markerHaloColor} from '$lib/services/colorConverter';
import {describe, expect, it} from 'vitest';
import {MARKER_VISITED_COLOR, markerBoxShadow} from './markerAppearance';

const COLOR = '#e11d48';

describe('markerBoxShadow', () => {
    it('uses the inverted ring for service pins', () => {
        expect(markerBoxShadow(COLOR, {inverted: true})).toBe(
            `0 0 0 3px ${COLOR}, 0 0 0 5px rgba(255,255,255,0.25), 0 2px 4px rgba(0,0,0,0.2)`,
        );
    });

    it('uses the shared visited outline', () => {
        expect(MARKER_VISITED_COLOR).toBe('#39ff14');
        expect(markerBoxShadow(COLOR, {visited: true})).toBe(
            `0 0 0 1px rgba(0,0,0,0.3), 0 0 0 3px ${MARKER_VISITED_COLOR}, 0 0 0 5px ${markerHaloColor(COLOR)}, 0 2px 4px rgba(0,0,0,0.2)`,
        );
    });

    it('matches the default archive pin ring', () => {
        expect(markerBoxShadow(COLOR)).toBe(
            `0 0 0 3px white, 0 0 0 5px ${markerHaloColor(COLOR)}, 0 2px 4px rgba(0,0,0,0.2)`,
        );
    });
});
