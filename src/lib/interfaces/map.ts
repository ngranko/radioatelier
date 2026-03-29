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

export interface IMarkerHandle {
    setPosition(latLng: LatLngLiteral): void;
    getPosition(): LatLngLiteral;
    show(): void;
    hide(): void;
    remove(): void;
    getElement(): HTMLElement | null;
    addClickListener(callback: () => void): EventUnsubscribe;
}

export interface IMapProvider {
    getZoom(): number;
    setZoom(zoom: number): void;
    getCenter(): LatLngLiteral | undefined;
    getBounds(): MapBounds | undefined;
    setCenter(lat: number, lng: number): void;
    fitBounds(bounds: MapBounds, padding?: BoundsPadding): void;
    createBounds(): MapBounds;
    setDraggable(isDraggable: boolean): void;

    onIdle(callback: () => void): EventUnsubscribe;
    onClick(callback: (latLng: LatLngLiteral) => void): EventUnsubscribe;
    onDragEnd(callback: () => void): EventUnsubscribe;
    onCenterChanged(callback: (center: LatLngLiteral, zoom: number) => void): EventUnsubscribe;
    onPointerMove(callback: (latLng: LatLngLiteral) => void): EventUnsubscribe;

    createMarkerHandle(
        position: LatLngLiteral,
        content: HTMLElement,
        options?: MarkerHandleOptions,
    ): IMarkerHandle;
    preloadMarkerLibrary(): Promise<void>;

    closeStreetView(): void;
    destroy(): void;
}
