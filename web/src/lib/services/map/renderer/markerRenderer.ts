import type {Marker} from '../marker';

export interface MarkerRenderer {
    ensureCreated(marker: Marker): void;

    syncAll(iterable: Iterable<Marker>): void;

    show(marker: Marker): void;

    hide(marker: Marker): void;

    remove(marker: Marker, onRemoved?: () => void): void;

    destroy(): void;
}
