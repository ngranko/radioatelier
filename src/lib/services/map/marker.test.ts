import type {MarkerIcon, MarkerSource} from '$lib/interfaces/marker';
import {describe, expect, it} from 'vitest';
import {Marker} from './marker';

const icon = (() => {}) as unknown as MarkerIcon;

function makeMarker(source: MarkerSource) {
    return new Marker({lat: 0, lng: 0}, {icon, color: '#000000', source});
}

describe('Marker source policy', () => {
    it.each([
        {
            source: 'list' as const,
            lazy: true,
            service: false,
            viewportManaged: true,
            zIndex: 0,
        },
        {
            source: 'search' as const,
            lazy: false,
            service: true,
            viewportManaged: true,
            zIndex: 1,
        },
        {
            source: 'share' as const,
            lazy: false,
            service: true,
            viewportManaged: false,
            zIndex: 1,
        },
        {
            source: 'draft' as const,
            lazy: false,
            service: true,
            viewportManaged: true,
            zIndex: 1,
        },
    ])('$source', ({source, lazy, service, viewportManaged, zIndex}) => {
        const marker = makeMarker(source);
        expect(marker.isLazy()).toBe(lazy);
        expect(marker.isServiceMarker()).toBe(service);
        expect(marker.isViewportManaged()).toBe(viewportManaged);
        expect(marker.getZIndex()).toBe(zIndex);
    });
});
