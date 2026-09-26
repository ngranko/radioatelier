import {describe, expect, it} from 'vitest';
import {metresBetween} from './distance';

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
