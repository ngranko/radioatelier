export interface MarkerOptions {
    icon: string;
    color: string;
    isDraggable?: boolean;
    source: MarkerSource;
    isVisited?: boolean;
    isRemoved?: boolean;
    onClick?(): void;
    onDragStart?(): void;
    onDragEnd?(): void;
}

export type MarkerSource = 'map' | 'list' | 'search';

export type MarkerId = string;

export interface MarkerStateUpdate {
    isVisited?: boolean;
    isRemoved?: boolean;
}