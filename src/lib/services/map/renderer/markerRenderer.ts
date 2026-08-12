import type {Marker} from '$lib/services/map/marker';

export type RendererMode = 'dom' | 'deck';

export interface MarkerRenderer {
    setMode(mode: RendererMode): void;

    ensureCreated(marker: Marker): void;

    syncAll(iterable: Iterable<Marker>): void;

    show(marker: Marker): void;

    hide(marker: Marker): void;

    remove(marker: Marker, onRemoved?: () => void): void;

    applyState(marker: Marker): void;

    destroy(): void;
}
