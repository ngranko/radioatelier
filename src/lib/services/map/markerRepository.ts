import type {MarkerId} from '$lib/interfaces/marker';
import {Marker} from './marker';

export class MarkerRepository {
    private markerCache = new Map<MarkerId, Marker>();
    private visibleMarkers = new Set<MarkerId>();
    private replacedMarkers = new Map<MarkerId, Marker>();

    public get(id: MarkerId): Marker | undefined {
        return this.markerCache.get(id);
    }

    public remove(id: MarkerId): void {
        this.markerCache.delete(id);
        this.visibleMarkers.delete(id);
    }

    public markVisible(id: MarkerId): void {
        this.visibleMarkers.add(id);
    }

    public markHidden(id: MarkerId): void {
        this.visibleMarkers.delete(id);
    }

    public isVisible(id: MarkerId): boolean {
        return this.visibleMarkers.has(id);
    }

    public getVisibleIds(): MarkerId[] {
        return Array.from(this.visibleMarkers);
    }

    public values(): IterableIterator<Marker> {
        return this.markerCache.values();
    }

    public ids(): MarkerId[] {
        return Array.from(this.markerCache.keys());
    }

    public maybeRestoreReplaced(id: MarkerId): Marker | null {
        const replaced = this.replacedMarkers.get(id) ?? null;
        if (replaced) {
            this.markerCache.set(id, replaced);
            this.replacedMarkers.delete(id);
        }
        return replaced;
    }

    public clear(): void {
        this.markerCache.clear();
        this.visibleMarkers.clear();
        this.replacedMarkers.clear();
    }

    public upsertWithPolicy(
        id: MarkerId,
        createMarker: () => Marker,
        source: 'map' | 'list' | 'search' | 'share',
    ): {action: 'inserted' | 'ignored' | 'replaced'; marker: Marker} {
        const existing = this.markerCache.get(id);
        if (!existing) {
            const marker = createMarker();
            this.markerCache.set(id, marker);
            return {action: 'inserted', marker};
        }

        if (source === 'search' && existing.getSource() !== 'search') {
            const marker = createMarker();
            existing.hide();
            this.replacedMarkers.set(id, existing);
            this.markerCache.set(id, marker);
            this.visibleMarkers.delete(id);
            return {action: 'replaced', marker};
        }

        if (source !== 'search' && existing.getSource() === 'search') {
            return {action: 'ignored', marker: existing};
        }

        return {action: 'ignored', marker: existing};
    }
}
