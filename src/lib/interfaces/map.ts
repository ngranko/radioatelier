export interface LatLngLiteral {
    lat: number;
    lng: number;
}

export type EventUnsubscribe = () => void;

export interface BoundsPadding {
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
}

export interface MapBounds {
    getCenter(): LatLngLiteral;
    contains(point: LatLngLiteral): boolean;
    extend(point: LatLngLiteral): void;
}

export interface MarkerHandleOptions {
    zIndex?: number;
    clickable?: boolean;
}

export interface MarkerHandle {
    setPosition(latLng: LatLngLiteral): void;
    getPosition(): LatLngLiteral;
    show(): void;
    hide(): void;
    remove(): void;
    getElement(): HTMLElement | null;
    addClickListener(callback: () => void): EventUnsubscribe;
}

export interface MapProvider {
    getZoom(): number;
    setZoom(zoom: number): void;
    getMinZoom(): number;
    getMaxZoom(): number;
    getCenter(): LatLngLiteral | undefined;
    getBounds(): MapBounds | undefined;
    setCenter(lat: number, lng: number): void;
    fitBounds(bounds: MapBounds, padding?: BoundsPadding): void;
    createBounds(): MapBounds;
    setDraggable(isDraggable: boolean): void;

    onIdle(callback: () => void): EventUnsubscribe;
    onClick(callback: (latLng: LatLngLiteral) => void): EventUnsubscribe;
    onDragEnd(callback: () => void): EventUnsubscribe;
    onPointerMove(callback: (latLng: LatLngLiteral) => void): EventUnsubscribe;

    createMarkerHandle(
        position: LatLngLiteral,
        content: HTMLElement,
        options?: MarkerHandleOptions,
    ): MarkerHandle;
    preloadMarkerLibrary(): Promise<void>;

    closeStreetView(): void;
    destroy(): void;
}
