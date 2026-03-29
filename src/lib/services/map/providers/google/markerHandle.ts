import type {EventUnsubscribe, IMarkerHandle, LatLngLiteral, MarkerHandleOptions} from '$lib/interfaces/map';

export class GoogleMarkerHandle implements IMarkerHandle {
    private marker: google.maps.marker.AdvancedMarkerElement;

    constructor(
        private map: google.maps.Map,
        position: LatLngLiteral,
        content: HTMLElement,
        options: MarkerHandleOptions = {},
    ) {
        this.marker = new google.maps.marker.AdvancedMarkerElement({
            position,
            content,
            collisionBehavior: google.maps.CollisionBehavior.REQUIRED,
            gmpClickable: options.clickable !== false,
            zIndex: options.zIndex ?? 0,
        });
    }

    setPosition(latLng: LatLngLiteral): void {
        this.marker.position = latLng;
    }

    getPosition(): LatLngLiteral {
        const pos = this.marker.position;
        if (!pos) return {lat: 0, lng: 0};
        if (typeof (pos as google.maps.LatLng).lat === 'function') {
            const latlng = pos as google.maps.LatLng;
            return {lat: latlng.lat(), lng: latlng.lng()};
        }
        return {lat: (pos as LatLngLiteral).lat, lng: (pos as LatLngLiteral).lng};
    }

    show(): void {
        if (!this.marker.map) {
            this.marker.map = this.map;
        }
    }

    hide(): void {
        this.marker.map = null;
    }

    remove(): void {
        this.marker.map = null;
    }

    getElement(): HTMLElement | null {
        return this.marker.content instanceof HTMLElement ? this.marker.content : null;
    }

    addClickListener(callback: () => void): EventUnsubscribe {
        const listener = this.marker.addListener('gmp-click', callback);
        return () => google.maps.event.removeListener(listener);
    }
}
