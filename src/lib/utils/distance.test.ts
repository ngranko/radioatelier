import {describe, expect, it} from 'vitest';
import {formatDistance, metresBetween} from './distance';

describe('metresBetween', () => {
    it('measures a degree of latitude', () => {
        expect(metresBetween({lat: 52, lng: 4.9}, {lat: 53, lng: 4.9})).toBeCloseTo(111195, -2);
    });
});

describe('formatDistance', () => {
    it('keeps one decimal below ten kilometres, with a Russian comma', () => {
        expect(formatDistance(1240)).toBe('1,2 км');
        expect(formatDistance(9949)).toBe('9,9 км');
    });

    it('moves up a unit when rounding reaches the next one', () => {
        expect(formatDistance(996)).toBe('1,0 км');
        expect(formatDistance(9960)).toBe('10 км');
    });
});
