import type {Marker} from '$lib/services/map/marker';
import {describe, expect, it, vi} from 'vitest';
import {buildClusteredLayers} from './clusteredLayers';
import type {ClusterPoint, MarkerPoint} from './markerClusterIndex';

function markerPoint(): MarkerPoint {
    return {
        kind: 'marker',
        position: [37.61, 55.75],
        marker: {
            getState: () => ({isVisited: false, isRemoved: false}),
            options: {color: '#112233', iconKey: 'landmark'},
        } as Marker,
    };
}

function clusterPoint(): ClusterPoint {
    return {
        kind: 'cluster',
        clusterId: 1,
        indexVersion: 1,
        markerCount: 4,
        label: '4',
        position: [37.61, 55.75],
    };
}

describe('buildClusteredLayers', () => {
    it('opens a marker from a Google Maps overlay click event', () => {
        const onMarkerClick = vi.fn();
        const point = markerPoint();
        const layers = buildClusteredLayers([point], {
            onMarkerClick,
            onClusterClick: vi.fn(),
        });
        const disk = layers.find(layer => layer.id === 'clustered-marker-disk');

        const handled = disk?.props.onClick?.({object: point}, {srcEvent: {stop: vi.fn()}});

        expect(handled).toBe(true);
        expect(onMarkerClick).toHaveBeenCalledWith(point.marker);
    });

    it('expands a cluster from a Google Maps overlay click event', () => {
        const onClusterClick = vi.fn();
        const point = clusterPoint();
        const layers = buildClusteredLayers([point], {
            onMarkerClick: vi.fn(),
            onClusterClick,
        });
        const disk = layers.find(layer => layer.id === 'marker-clusters');

        const handled = disk?.props.onClick?.({object: point}, {});

        expect(handled).toBe(true);
        expect(onClusterClick).toHaveBeenCalledWith(point);
    });
});
