import config from '$lib/config';
import type {Location} from '$lib/interfaces/location';
import type {
    BoundsPadding,
    EventUnsubscribe,
    LatLngLiteral,
    MapBounds,
    MapProvider,
    MarkerHandle,
    MarkerHandleOptions,
} from '$lib/interfaces/map';
import {computeMinZoomForContainer} from '$lib/services/map/mapMinZoom';
import {MERCATOR_WORLD_RESTRICTION} from '$lib/services/map/mapRestriction';
import {GoogleMapBounds} from '$lib/services/map/providers/google/bounds';
import {DeckOverlayHost} from '$lib/services/map/providers/google/deckOverlayHost';
import {GoogleMarkerHandle} from '$lib/services/map/providers/google/markerHandle';
import {themeState} from '$lib/state/theme.svelte';
import {importLibrary as loadGoogleMapsLibrary, setOptions} from '@googlemaps/js-api-loader';
import {prefersReducedMotion} from 'svelte/motion';

type GoogleMapsLibraryName = Parameters<typeof loadGoogleMapsLibrary>[0];

const MAP_MAX_ZOOM = 21;

let loaderConfigured = false;

// setOptions may only usefully run once per page; guard so multiple provider
// instances don't re-issue it. Kept out of module scope because it must not
// run during SSR.
function configureLoader(): void {
    if (loaderConfigured) {
        return;
    }
    setOptions({
        key: config.googleMapsApiKey,
        v: 'weekly',
        libraries: ['places'],
    });
    loaderConfigured = true;
}

export class GoogleMapsProvider implements MapProvider {
    private map?: google.maps.Map;
    private deckOverlay?: DeckOverlayHost;
    private minZoom = 2;
    private resizeObserver?: ResizeObserver;

    public constructor() {
        configureLoader();
    }

    public importLibrary<T extends GoogleMapsLibraryName>(library: T) {
        configureLoader();
        return loadGoogleMapsLibrary(library);
    }

    public async initialize(container: HTMLElement, center: Location): Promise<void> {
        const [{Map}, {ColorScheme}] = await Promise.all([
            this.importLibrary('maps'),
            this.importLibrary('core'),
        ]);

        this.minZoom = computeMinZoomForContainer(container);
        const initialZoom = Math.max(center.zoom ?? 15, this.minZoom);

        this.map = new Map(container, {
            zoom: initialZoom,
            center,
            minZoom: this.minZoom,
            maxZoom: MAP_MAX_ZOOM,
            isFractionalZoomEnabled: true,
            mapId: config.googleMapsId,
            controlSize: 40,
            mapTypeControl: false,
            cameraControl: false,
            fullscreenControl: false,
            zoomControl: false,
            clickableIcons: false,
            colorScheme: this.resolveColorScheme(ColorScheme),
            restriction: MERCATOR_WORLD_RESTRICTION,
        });

        this.resizeObserver = new ResizeObserver(() => {
            const next = computeMinZoomForContainer(container);
            if (next === this.minZoom) {
                return;
            }
            this.minZoom = next;
            this.map?.setOptions({minZoom: next});
        });
        this.resizeObserver.observe(container);
    }

    private resolveColorScheme(
        ColorScheme: typeof google.maps.ColorScheme,
    ): google.maps.ColorScheme {
        if (themeState.preference === 'system') {
            return ColorScheme.FOLLOW_SYSTEM;
        }
        return themeState.resolved === 'dark' ? ColorScheme.DARK : ColorScheme.LIGHT;
    }

    public getZoom(): number {
        return this.map?.getZoom() ?? 15;
    }

    public getMinZoom(): number {
        return this.minZoom;
    }

    public getMaxZoom(): number {
        return MAP_MAX_ZOOM;
    }

    public setZoom(zoom: number): void {
        if (!this.map) {
            return;
        }
        this.map.moveCamera({zoom});
    }

    public getCenter(): LatLngLiteral | undefined {
        const center = this.map?.getCenter();
        return center ? {lat: center.lat(), lng: center.lng()} : undefined;
    }

    public getBounds(): MapBounds | undefined {
        const bounds = this.map?.getBounds();
        return bounds ? new GoogleMapBounds(bounds) : undefined;
    }

    public setCenter(lat: number, lng: number): void {
        const center = new google.maps.LatLng(lat, lng);
        if (prefersReducedMotion.current) {
            this.map?.setCenter(center);
            return;
        }
        this.map?.panTo(center);
    }

    public fitBounds(bounds: MapBounds, padding?: BoundsPadding): void {
        if (!(bounds instanceof GoogleMapBounds) || !this.map) {
            return;
        }
        this.map.fitBounds(bounds.raw, padding);
        if (prefersReducedMotion.current) {
            this.jumpToCurrentCamera(this.map);
        }
    }

    // fitBounds has no instant form, but the map reports its destination as soon as the call
    // returns, so moving the camera there cuts the glide short.
    private jumpToCurrentCamera(map: google.maps.Map): void {
        map.moveCamera({center: map.getCenter(), zoom: map.getZoom()});
    }

    public createBounds(): MapBounds {
        return new GoogleMapBounds(new google.maps.LatLngBounds());
    }

    public setDraggable(isDraggable: boolean): void {
        this.map?.set('draggable', isDraggable);
    }

    public onIdle(callback: () => void): EventUnsubscribe {
        if (!this.map) {
            return () => {};
        }
        const listener = google.maps.event.addListener(this.map, 'idle', callback);
        return () => google.maps.event.removeListener(listener);
    }

    public onClick(callback: (latLng: LatLngLiteral) => void): EventUnsubscribe {
        if (!this.map) {
            return () => {};
        }
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

    public onDragStart(callback: () => void): EventUnsubscribe {
        if (!this.map) {
            return () => {};
        }
        const listener = google.maps.event.addListener(this.map, 'dragstart', callback);
        return () => google.maps.event.removeListener(listener);
    }

    public onDragEnd(callback: () => void): EventUnsubscribe {
        if (!this.map) {
            return () => {};
        }
        const listener = google.maps.event.addListener(this.map, 'dragend', callback);
        return () => google.maps.event.removeListener(listener);
    }

    public onPointerMove(callback: (latLng: LatLngLiteral) => void): EventUnsubscribe {
        if (!this.map) {
            return () => {};
        }
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

    public createMarkerHandle(
        position: LatLngLiteral,
        content: HTMLElement,
        options: MarkerHandleOptions = {},
    ): MarkerHandle {
        if (!this.map) {
            throw new Error('Map not initialized');
        }
        return new GoogleMarkerHandle(this.map, position, content, options);
    }

    public async preloadMarkerLibrary(): Promise<void> {
        await this.importLibrary('marker');
    }

    public closeStreetView(): void {
        this.map?.getStreetView().setVisible(false);
    }

    public destroy(): void {
        this.deckOverlay?.destroy();
        this.deckOverlay = undefined;
        this.resizeObserver?.disconnect();
        this.resizeObserver = undefined;
        if (this.map) {
            google.maps.event.clearInstanceListeners(this.map);
        }
        this.map = undefined;
    }

    public getGoogleMap(): google.maps.Map | undefined {
        return this.map;
    }

    public getDeckOverlay(): DeckOverlayHost {
        if (!this.map) {
            throw new Error('Map not initialized');
        }
        this.deckOverlay ??= new DeckOverlayHost(this.map);
        return this.deckOverlay;
    }
}
