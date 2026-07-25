import type {BoundsRect, LatLngLiteral, MapBounds} from '$lib/interfaces/map';
import {describe, expect, it} from 'vitest';
import type {Marker} from './marker';
import type {MarkerRepository} from './markerRepository';
import {selectVisibleMarkerIds} from './viewportIndex';

function makeBounds(rect: BoundsRect, center: LatLngLiteral): MapBounds {
    return {
        toRect: () => rect,
        getCenter: () => center,
        contains: () => false,
        extend: () => {},
    };
}

function makeRepo(positions: Record<string, LatLngLiteral>): MarkerRepository {
    const markers = new Map<string, Marker>(
        Object.entries(positions).map(([id, position]) => [
            id,
            {getPosition: () => position} as unknown as Marker,
        ]),
    );
    return {entries: () => markers.entries()} as unknown as MarkerRepository;
}

describe('selectVisibleMarkerIds', () => {
    it('keeps only markers inside the bounds', () => {
        const repo = makeRepo({
            inside: {lat: 10, lng: 10},
            northOfBounds: {lat: 40, lng: 10},
            eastOfBounds: {lat: 10, lng: 40},
        });
        const bounds = makeBounds({north: 20, south: 0, east: 20, west: 0}, {lat: 10, lng: 10});

        expect([...selectVisibleMarkerIds(bounds, repo, 100)]).toEqual(['inside']);
    });

    it('handles viewports that straddle the antimeridian', () => {
        const repo = makeRepo({
            westOfLine: {lat: 0, lng: 175},
            eastOfLine: {lat: 0, lng: -175},
            farAway: {lat: 0, lng: 0},
        });
        const bounds = makeBounds(
            {north: 10, south: -10, east: -170, west: 170},
            {lat: 0, lng: 180},
        );

        expect([...selectVisibleMarkerIds(bounds, repo, 100)].sort()).toEqual([
            'eastOfLine',
            'westOfLine',
        ]);
    });

    it('keeps the markers nearest the centre when over the limit', () => {
        const repo = makeRepo({
            far: {lat: 9, lng: 0},
            near: {lat: 1, lng: 0},
            middle: {lat: 5, lng: 0},
        });
        const bounds = makeBounds({north: 10, south: -10, east: 10, west: -10}, {lat: 0, lng: 0});

        expect([...selectVisibleMarkerIds(bounds, repo, 2)].sort()).toEqual(['middle', 'near']);
    });
});
