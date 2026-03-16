import type {Id} from '$convex/_generated/dataModel';

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

export type MarkerSource = 'map' | 'list' | 'search' | 'share';

export type MarkerId = string;

export interface MarkerStateUpdate {
    isVisited?: boolean;
    isRemoved?: boolean;
}

export interface MarkerListItem {
    id: Id<'objects'>;
    latitude: number;
    longitude: number;
    isRemoved: boolean;
    isVisited: boolean;
    isPublic: boolean;
    isOwner: boolean;
}
