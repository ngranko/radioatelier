import {describe, expect, it} from 'vitest';
import {
    clampMarkerCount,
    DEBUG_MARKER_DEFAULT,
    DEBUG_MARKER_MAX,
    DEBUG_MARKER_MIN,
} from './markerCount';

describe('clampMarkerCount', () => {
    it('clamps to the supported range', () => {
        expect(clampMarkerCount(DEBUG_MARKER_MIN - 10)).toBe(DEBUG_MARKER_MIN);
        expect(clampMarkerCount(DEBUG_MARKER_MAX + 10)).toBe(DEBUG_MARKER_MAX);
        expect(clampMarkerCount(250.6)).toBe(251);
    });

    it('falls back when the value is not a number', () => {
        expect(clampMarkerCount(Number.NaN)).toBe(DEBUG_MARKER_DEFAULT);
    });
});
