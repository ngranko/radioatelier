import {describe, expect, it} from 'vitest';
import {formatDistance, metresBetween} from './distance';

describe('metresBetween', () => {
    it('measures nothing between a point and itself', () => {
        expect(metresBetween({lat: 52.37, lng: 4.9}, {lat: 52.37, lng: 4.9})).toBe(0);
    });

    it('measures a degree of latitude', () => {
        expect(metresBetween({lat: 52, lng: 4.9}, {lat: 53, lng: 4.9})).toBeCloseTo(111195, -2);
    });

    it('shrinks a degree of longitude with the latitude', () => {
        const atEquator = metresBetween({lat: 0, lng: 0}, {lat: 0, lng: 1});
        const atAmsterdam = metresBetween({lat: 52.37, lng: 4}, {lat: 52.37, lng: 5});

        expect(atAmsterdam).toBeLessThan(atEquator);
        expect(atAmsterdam).toBeCloseTo(atEquator * Math.cos((52.37 * Math.PI) / 180), -1);
    });
});

describe('formatDistance', () => {
    it('rounds metres to the nearest ten', () => {
        expect(formatDistance(123)).toBe('120 м');
        expect(formatDistance(8)).toBe('10 м');
    });

    it('keeps one decimal below ten kilometres, with a Russian comma', () => {
        expect(formatDistance(1240)).toBe('1,2 км');
        expect(formatDistance(9949)).toBe('9,9 км');
    });

    it('drops the decimal further out', () => {
        expect(formatDistance(15400)).toBe('15 км');
    });
});
