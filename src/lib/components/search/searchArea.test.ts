import {describe, expect, it} from 'vitest';
import {measureViewport, shouldOfferAreaSearch, type SearchViewport} from './searchArea';

const CENTER = {lat: 52.37, lng: 4.9};

function viewport(overrides: Partial<SearchViewport> = {}): SearchViewport {
    return {center: CENTER, radius: 2000, ...overrides};
}

describe('measureViewport', () => {
    it('measures the radius out to the corner of the bounds', () => {
        const measured = measureViewport(CENTER, {
            north: 52.38,
            south: 52.36,
            east: 4.92,
            west: 4.88,
        });

        expect(measured.center).toEqual(CENTER);
        expect(measured.radius).toBeGreaterThan(1000);
        expect(measured.radius).toBeLessThan(2000);
    });
});

describe('shouldOfferAreaSearch', () => {
    it('stays quiet while the map barely moves', () => {
        const nudged = viewport({center: {lat: 52.3705, lng: 4.9005}});

        expect(shouldOfferAreaSearch(viewport(), nudged)).toBe(false);
    });

    it('offers a search once the map is panned off the searched area', () => {
        const panned = viewport({center: {lat: 52.39, lng: 4.9}});

        expect(shouldOfferAreaSearch(viewport(), panned)).toBe(true);
    });

    it('offers a search after a zoom out that widens the area', () => {
        expect(shouldOfferAreaSearch(viewport(), viewport({radius: 6000}))).toBe(true);
    });

    it('offers a search after a zoom in that narrows the area', () => {
        expect(shouldOfferAreaSearch(viewport(), viewport({radius: 600}))).toBe(true);
    });

    it('treats a fit of the results as the same area', () => {
        expect(shouldOfferAreaSearch(viewport(), viewport({radius: 2600}))).toBe(false);
    });
});
