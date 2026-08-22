import type {Marker} from '$lib/services/map/marker';
import {describe, expect, it, vi} from 'vitest';
import {buildMarkerLayers} from './markerLayers';
import type {MarkerPoint} from './markerPoints';

function markerPoint(): MarkerPoint {
    return {
        position: [37.61, 55.75],
        marker: {
            getState: () => ({isVisited: false, isRemoved: false}),
            options: {color: '#112233', iconKey: 'landmark'},
        } as Marker,
    };
}

describe('buildMarkerLayers', () => {
    it('opens a marker from a Google Maps overlay click event', () => {
        const onMarkerClick = vi.fn();
        const point = markerPoint();
        const layers = buildMarkerLayers(
            [point],
            {fades: [], exits: []},
            {onMarkerClick, requestFrame: vi.fn()},
        );
        const sprites = layers.find(layer => layer.id === 'gpu-marker');

        const handled = sprites?.props.onClick?.({object: point}, {srcEvent: {stop: vi.fn()}});

        expect(handled).toBe(true);
        expect(onMarkerClick).toHaveBeenCalledWith(point.marker);
    });
});
