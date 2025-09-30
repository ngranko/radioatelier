export interface MarkerOptions {
    icon: string;
    color: string;
    isDraggable?: boolean;
    source: MarkerSource;
    onClick?(): void;
    onDragStart?(): void;
    onDragEnd?(newPosition: google.maps.LatLngLiteral): void;
    onCreated?(): void;
}

export type MarkerSource = 'map' | 'list' | 'search';

export type MarkerId = string;