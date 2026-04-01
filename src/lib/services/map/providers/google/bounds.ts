import type {LatLngLiteral, MapBounds} from '$lib/interfaces/map';

export class GoogleMapBounds implements MapBounds {
    constructor(private bounds: google.maps.LatLngBounds) {}

    getCenter(): LatLngLiteral {
        const center = this.bounds.getCenter();
        return {lat: center.lat(), lng: center.lng()};
    }

    contains(point: LatLngLiteral): boolean {
        return this.bounds.contains(point);
    }

    extend(point: LatLngLiteral): void {
        this.bounds.extend(point);
    }

    get raw(): google.maps.LatLngBounds {
        return this.bounds;
    }
}
