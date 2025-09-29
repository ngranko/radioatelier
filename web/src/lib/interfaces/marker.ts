export interface markerOptions {
    icon: string;
    color: string;
    isDraggable?: boolean;
    source: MarkerSource;
    onClick?(): void;
    onDragStart?(): void;
    onDragEnd?(newPosition: google.maps.LatLngLiteral): void;
}

export type MarkerSource = 'map' | 'list' | 'search';