import type {
    BoundsPadding,
    EventUnsubscribe,
    IMapProvider,
    IMarkerHandle,
    LatLngLiteral,
    MapBounds,
    MarkerHandleOptions,
} from '$lib/interfaces/map';
import type {Location} from '$lib/interfaces/location';
import config from '$lib/config';
import {themeState} from '$lib/state/theme.svelte';
import {Loader} from '@googlemaps/js-api-loader';
import {GoogleMapBounds} from './bounds';
import {GoogleMarkerHandle} from './markerHandle';

export class GoogleMapsProvider implements IMapProvider {
    readonly loader: Loader;
    private map?: google.maps.Map;

    constructor() {
        this.loader = new Loader({
            apiKey: config.googleMapsApiKey,
            version: 'weekly',
            libraries: ['places'],
        });
    }

    async initialize(container: HTMLElement, center: Location): Promise<void> {
        const [{Map}, {ColorScheme}] = await Promise.all([
            this.loader.importLibrary('maps'),
            this.loader.importLibrary('core'),
        ]);

        this.map = new Map(container, {
            zoom: center.zoom ?? 15,
            center,
            mapId: config.googleMapsId,
            controlSize: 40,
            mapTypeControl: false,
            cameraControl: false,
            fullscreenControl: false,
            zoomControl: false,
            clickableIcons: false,
            colorScheme: this.resolveColorScheme(ColorScheme),
        });
    }

    private resolveColorScheme(
        ColorScheme: typeof google.maps.ColorScheme,
    ): google.maps.ColorScheme {
        if (themeState.preference === 'system') {
            return ColorScheme.FOLLOW_SYSTEM;
        }
        return themeState.resolved === 'dark' ? ColorScheme.DARK : ColorScheme.LIGHT;
    }

    getZoom(): number {
        return this.map?.getZoom() ?? 15;
    }

    setZoom(zoom: number): void {
        this.map?.setZoom(zoom);
    }

    getCenter(): LatLngLiteral | undefined {
        const center = this.map?.getCenter();
        return center ? {lat: center.lat(), lng: center.lng()} : undefined;
    }

    getBounds(): MapBounds | undefined {
        const bounds = this.map?.getBounds();
        return bounds ? new GoogleMapBounds(bounds) : undefined;
    }

    setCenter(lat: number, lng: number): void {
        this.map?.setZoom(15);
        this.map?.panTo(new google.maps.LatLng(lat, lng));
    }

    fitBounds(bounds: MapBounds, padding?: BoundsPadding): void {
        if (!(bounds instanceof GoogleMapBounds) || !this.map) {
            return;
        }
        this.map.fitBounds(bounds.raw, padding);
    }

    createBounds(): MapBounds {
        return new GoogleMapBounds(new google.maps.LatLngBounds());
    }

    setDraggable(isDraggable: boolean): void {
        this.map?.set('draggable', isDraggable);
    }

    onIdle(callback: () => void): EventUnsubscribe {
        if (!this.map) return () => {};
        const listener = google.maps.event.addListener(this.map, 'idle', callback);
        return () => google.maps.event.removeListener(listener);
    }

    onClick(callback: (latLng: LatLngLiteral) => void): EventUnsubscribe {
        if (!this.map) return () => {};
        const listener = google.maps.event.addListener(
            this.map,
            'click',
            (event: google.maps.MapMouseEvent) => {
                if (event.latLng) {
                    callback({lat: event.latLng.lat(), lng: event.latLng.lng()});
                }
            },
        );
        return () => google.maps.event.removeListener(listener);
    }

    onDragEnd(callback: () => void): EventUnsubscribe {
        if (!this.map) return () => {};
        const listener = google.maps.event.addListener(this.map, 'dragend', callback);
        return () => google.maps.event.removeListener(listener);
    }

    onCenterChanged(
        callback: (center: LatLngLiteral, zoom: number) => void,
    ): EventUnsubscribe {
        if (!this.map) return () => {};
        const listener = google.maps.event.addListener(this.map, 'center_changed', () => {
            const center = this.map!.getCenter();
            if (center) {
                callback({lat: center.lat(), lng: center.lng()}, this.map!.getZoom() ?? 15);
            }
        });
        return () => google.maps.event.removeListener(listener);
    }

    onPointerMove(callback: (latLng: LatLngLiteral) => void): EventUnsubscribe {
        if (!this.map) return () => {};
        const listener = google.maps.event.addListener(
            this.map,
            'mousemove',
            (event: google.maps.MapMouseEvent) => {
                if (event.latLng) {
                    callback({lat: event.latLng.lat(), lng: event.latLng.lng()});
                }
            },
        );
        return () => google.maps.event.removeListener(listener);
    }

    createMarkerHandle(
        position: LatLngLiteral,
        content: HTMLElement,
        options: MarkerHandleOptions = {},
    ): IMarkerHandle {
        if (!this.map) {
            throw new Error('Map not initialized');
        }
        return new GoogleMarkerHandle(this.map, position, content, options);
    }

    async preloadMarkerLibrary(): Promise<void> {
        await this.loader.importLibrary('marker');
    }

    closeStreetView(): void {
        this.map?.getStreetView().setVisible(false);
    }

    destroy(): void {
        if (this.map) {
            google.maps.event.clearInstanceListeners(this.map);
        }
        this.map = undefined;
    }

    getGoogleMap(): google.maps.Map | undefined {
        return this.map;
    }
}
