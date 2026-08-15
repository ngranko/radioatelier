import {describe, expect, it} from 'vitest';
import {generateViewportPositions, rectAround} from './generatePositions';

describe('generateViewportPositions', () => {
    it('returns an empty list for a non-positive count', () => {
        expect(generateViewportPositions(0, rectAround({lat: 0, lng: 0}))).toEqual([]);
    });

    it('keeps markers inside the viewport inset', () => {
        const rect = {north: 10, south: 0, east: 10, west: 0};
        const positions = generateViewportPositions(4, rect);

        expect(positions).toHaveLength(4);
        for (const position of positions) {
            expect(position.lat).toBeGreaterThan(0.5);
            expect(position.lat).toBeLessThan(9.5);
            expect(position.lng).toBeGreaterThan(0.5);
            expect(position.lng).toBeLessThan(9.5);
        }
    });

    it('unwraps an antimeridian-spanning viewport', () => {
        const positions = generateViewportPositions(1, {
            north: 1,
            south: -1,
            east: -170,
            west: 170,
        });

        expect(positions).toHaveLength(1);
        expect(positions[0].lng).toBeGreaterThan(170);
        expect(positions[0].lng).toBeLessThanOrEqual(180);
    });
});
