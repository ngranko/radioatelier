import type {BoundsRect, LatLngLiteral, MapBounds} from '$lib/interfaces/map';
import {describe, expect, it} from 'vitest';
import type {Marker} from './marker';
import type {MarkerRepository} from './markerRepository';
import {selectVisibleMarkerIds} from './viewportSelection';

function makeBounds(rect: BoundsRect, center: LatLngLiteral): MapBounds {
    return {
        toRect: () => rect,
        getCenter: () => center,
        extend: () => {},
    };
}

function makeRepo(
    positions: Record<string, LatLngLiteral>,
    unmanagedIds: ReadonlySet<string> = new Set(),
): MarkerRepository {
    const markers = new Map<string, Marker>(
        Object.entries(positions).map(([id, position]) => [
            id,
            {
                getPosition: () => position,
                isViewportManaged: () => !unmanagedIds.has(id),
            } as unknown as Marker,
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

    it('ranks nearest across the antimeridian when over the limit', () => {
        const repo = makeRepo({
            acrossLine: {lat: 0, lng: -179},
            sameSideFar: {lat: 0, lng: 170},
            sameSideNear: {lat: 0, lng: 178},
        });
        const bounds = makeBounds(
            {north: 10, south: -10, east: -170, west: 170},
            {lat: 0, lng: 179},
        );

        expect([...selectVisibleMarkerIds(bounds, repo, 2)].sort()).toEqual([
            'acrossLine',
            'sameSideNear',
        ]);
    });

    it('uses great-circle ordering in wide high-latitude viewports', () => {
        const repo = makeRepo({
            farther: {lat: 70, lng: -54},
            nearer: {lat: 89, lng: -60},
        });
        const bounds = makeBounds(
            {north: 90, south: 60, east: 0, west: -90},
            {lat: 80, lng: 0},
        );

        expect([...selectVisibleMarkerIds(bounds, repo, 1)]).toEqual(['nearer']);
    });

    it('always keeps non-viewport-managed markers, even outside bounds or over the limit', () => {
        const repo = makeRepo(
            {
                far: {lat: 9, lng: 0},
                near: {lat: 1, lng: 0},
                middle: {lat: 5, lng: 0},
                shareOutside: {lat: 40, lng: 40},
            },
            new Set(['shareOutside']),
        );
        const bounds = makeBounds({north: 10, south: -10, east: 10, west: -10}, {lat: 0, lng: 0});

        expect([...selectVisibleMarkerIds(bounds, repo, 2)].sort()).toEqual([
            'middle',
            'near',
            'shareOutside',
        ]);
    });
});
