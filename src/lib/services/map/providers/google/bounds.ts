import type {BoundsRect, LatLngLiteral, MapBounds} from '$lib/interfaces/map';

export class GoogleMapBounds implements MapBounds {
    public constructor(private bounds: google.maps.LatLngBounds) {}

    public getCenter(): LatLngLiteral {
        const center = this.bounds.getCenter();
        return {lat: center.lat(), lng: center.lng()};
    }

    public extend(point: LatLngLiteral): void {
        this.bounds.extend(point);
    }

    public toRect(): BoundsRect {
        return this.bounds.toJSON();
    }

    public get raw(): google.maps.LatLngBounds {
        return this.bounds;
    }
}
