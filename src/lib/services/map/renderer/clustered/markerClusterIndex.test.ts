import type {Marker} from '$lib/services/map/marker';
import {describe, expect, it} from 'vitest';
import {MarkerClusterIndex} from './markerClusterIndex';

function marker(lat: number, lng: number): Marker {
    return {getPosition: () => ({lat, lng})} as Marker;
}

describe('MarkerClusterIndex', () => {
    it('clusters dense markers and exposes the expansion zoom', () => {
        const index = new MarkerClusterIndex();
        index.load([marker(55.75, 37.61), marker(55.7501, 37.6101), marker(55.7502, 37.6102)]);

        const points = index.getPoints(8);

        expect(points).toHaveLength(1);
        expect(points[0]).toMatchObject({kind: 'cluster', markerCount: 3, label: '3'});
        if (points[0].kind === 'cluster') {
            expect(
                index.getExpansionZoom(points[0].clusterId, points[0].indexVersion),
            ).toBeGreaterThan(8);
        }
    });

    it('ignores a cluster from an index that has been replaced', () => {
        const index = new MarkerClusterIndex();
        index.load([marker(55.75, 37.61), marker(55.7501, 37.6101), marker(55.7502, 37.6102)]);
        const staleCluster = index.getPoints(8)[0];
        expect(staleCluster.kind).toBe('cluster');

        index.load([marker(48.85, 2.35)]);

        if (staleCluster.kind === 'cluster') {
            expect(
                index.getExpansionZoom(staleCluster.clusterId, staleCluster.indexVersion),
            ).toBeUndefined();
        }
    });

    it('returns the original markers beyond the clustering zoom', () => {
        const markers = [marker(55.75, 37.61), marker(55.7501, 37.6101), marker(55.7502, 37.6102)];
        const index = new MarkerClusterIndex();
        index.load(markers);

        const points = index.getPoints(18);

        expect(points).toHaveLength(3);
        expect(points.every(point => point.kind === 'marker')).toBe(true);
        expect(points.map(point => (point.kind === 'marker' ? point.marker : null))).toEqual(
            expect.arrayContaining(markers),
        );
    });
});
